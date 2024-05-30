import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  InternalServerErrorException,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import { AppService } from "./app.service";
import { User } from "./schemas/user.schema";
import axios, { AxiosError } from "axios";
import * as fs from "fs/promises";
import * as path from "path";
import checkFileExists from "./utils/checkFileExists";
import { createReadStream } from "fs";
import { RabbitMQService } from "./rabbitmq.service";
import { MessagePattern } from "@nestjs/microservices";
import { MailService } from "./mail.service";

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly rabbitMQService: RabbitMQService,
    private readonly mailService: MailService
  ) {}

  // On the request store the user entry in db. After the creation, send an email and rabbit event. Both can be dummy sending (no consumer needed).
  @Post("/api/users")
  async createUser(@Body() body): Promise<string> {
    let user;
    try {
      user = await this.appService.createUser(body);
    } catch (e) {
      if (e.name === "ValidationError") {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
    //Send mail
    await this.mailService.sendMail();

    //Send Message to rabbitmq
    await this.rabbitMQService.send(user);
    return user;
  }

  // Retrieves data from https://reqres.in/api/users/{userId} and returns a user in JSON representation.
  @Get("/api/user/:userId")
  async getUserById(@Param("userId") userId: string): Promise<User> {
    try {
      const response = await axios.get(`https://reqres.in/api/users/${userId}`);
      return response.data.data;
    } catch (e) {
      if (e.response.status === 404) {
        throw new NotFoundException();
      }
      throw new InternalServerErrorException();
    }
  }

  //   Retrieves image by 'avatar' URL.
  // On the fi rst request it should save the image as a plain fi le, stored as a mongodb entry with userId and hash. Return its base64-encoded representation.
  // On following requests should return the previously saved fi le in base64-encoded. representation (retrieve from db).
  @Get("/api/user/:userId/avtaar")
  async getAvtaarById(@Param("userId") userId, @Res() res): Promise<void> {
    const user = await this.getUserById(userId);
    let avtaar_path = await this.appService.getAvatar(userId);
    if (!avtaar_path) {
      const filePath = path.join(
        __dirname,
        "../avatars/" + new Date().getTime() + ".jpg"
      );
      const response = await axios.get(user.avatar, {
        responseType: "arraybuffer",
      });
      const imageBuffer = Buffer.from(response.data, "binary");
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, imageBuffer, {
        flag: "w",
      });
      await this.appService.saveAvatar(userId, filePath);
      avtaar_path = filePath;
    }
    const file = createReadStream(avtaar_path, {});
    file.pipe(res);
  }

  @Delete("/api/user/:userId/avtaar")
  async deleteAvtaarById(@Param("userId") userId): Promise<void> {
    const userAvtaar = await this.appService.getAvatar(userId);
    if (!userAvtaar) {
      throw new NotFoundException();
    }
    await this.appService.removeAvatar(userId);
    await fs.unlink(userAvtaar);
  }
}
