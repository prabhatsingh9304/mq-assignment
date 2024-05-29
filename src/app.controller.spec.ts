import { Test, TestingModule } from "@nestjs/testing";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { RabbitMQService } from "./rabbitmq.service";
import * as fs_promises from "fs/promises";
import * as fs from "fs";
import axios from "axios";
import { Readable } from "stream";
import { MailerModule } from "@nestjs-modules/mailer";
import { MailService } from "./mail.service";
import { MailerService } from "@nestjs-modules/mailer";

const mockUserModel = jest.fn().mockImplementation((userData) => {
  return {
    save: jest.fn().mockImplementation(() => {
      if (!userData) {
        throw {
          name: "Error",
          message: "Other error",
        };
      }
      if (!userData.first_name || !userData.last_name || !userData.email) {
        throw {
          name: "ValidationError",
          message: "first_name, last_name and email are required",
        };
      }
      Promise.resolve(userData);
    }),
  };
});

const mockUserAvtaarModel: any = jest.fn().mockImplementation((userData) => {
  return {
    save: jest.fn().mockImplementation(() => {
      Promise.resolve(userData);
    }),
  };
});

mockUserAvtaarModel.findOne = jest.fn().mockImplementation((id) => {
  return {
    id: id,
    avatar: "https://reqres.in/img/faces/1-image.jpg",
  };
});

mockUserAvtaarModel.findOneAndDelete = jest.fn().mockImplementation((id) => {
  return {
    id: id,
    avatar: "https://reqres.in/img/faces/1-image.jpg",
  };
});

describe("AppController", () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), MailerModule],
      controllers: [AppController],
      providers: [
        AppService,
        MailService,
        {
          provide: RabbitMQService,
          useValue: {
            send: jest
              .fn()
              .mockImplementation(() => Promise.resolve("User created")),
          },
        },
        { provide: getModelToken("User"), useValue: mockUserModel },
        { provide: getModelToken("UserAvtaar"), useValue: mockUserAvtaarModel },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe("create user", () => {
    it("should create user when correct data is passed", async () => {
      const userBody = {
        first_name: "test",
        last_name: "test",
        email: "test@test.com",
      };
      const createUserResponse = await appController.createUser(userBody);
      expect(createUserResponse).toBe("User created");
    });

    it("should throw bad request if data is incomplete", async () => {
      const userBody = {
        last_name: "test",
        email: "test@test.com",
      };
      await expect(appController.createUser(userBody)).rejects.toThrow(
        "first_name, last_name and email are required"
      );
    });

    it("should throw error in case there are other errors", async () => {
      await expect(appController.createUser(null)).rejects.toThrow(
        "Internal Server Error"
      );
    });
  });

  describe("get user", () => {
    it("should get user by id", async () => {
      await expect(appController.getUserById("1")).resolves.toEqual({
        avatar: "https://reqres.in/img/faces/1-image.jpg",
        email: "george.bluth@reqres.in",
        first_name: "George",
        id: 1,
        last_name: "Bluth",
      });
    });

    it("should throw 404 error", async () => {
      jest.spyOn(axios, "get").mockImplementationOnce(async () => {
        throw {
          response: {
            status: 404,
          },
        };
      });
      await expect(appController.getUserById("1a")).rejects.toThrow(
        "Not Found"
      );
    });

    it("should throw other errors", async () => {
      jest.spyOn(axios, "get").mockImplementationOnce(async () => {
        throw {
          response: {
            status: 500,
          },
        };
      });
      await expect(appController.getUserById("1a")).rejects.toThrow(
        "Internal Server Error"
      );
    });
  });

  describe("get avatar", () => {
    it("should save avatar if called for first time", async () => {
      jest.spyOn(fs_promises, "writeFile");
      const res = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      mockUserAvtaarModel.findOne = jest.fn().mockImplementationOnce(() => {
        return null;
      });
      await appController.getAvtaarById("1", res);
      expect(fs_promises.writeFile).toHaveBeenCalledTimes(1);
    }, 60000);

    it("should not save avatar if not called for first time", async () => {
      jest.clearAllMocks();
      jest.spyOn(fs_promises, "writeFile");
      jest.spyOn(fs, "createReadStream").mockImplementation(() => {
        const mockData = "mock file data";
        return new Readable({
          read() {
            this.push(mockData);
            this.push(null);
          },
        }) as any;
      });

      const res = {
        on: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        once: jest.fn(),
        emit: jest.fn(),
      };

      mockUserAvtaarModel.findOne = jest.fn().mockImplementationOnce((id) => {
        return {
          userId: id,
          avatar: "/mock/path/image.jpg",
        };
      });
      await appController.getAvtaarById("1", res);
      expect(fs_promises.writeFile).toHaveBeenCalledTimes(0);
    });
  });

  describe("delete avatar", () => {
    it("should delete avatar", async () => {
      jest.spyOn(fs_promises, "unlink").mockImplementationOnce(async () => {});
      mockUserAvtaarModel.findOne = jest.fn().mockImplementationOnce((id) => {
        return {
          userId: id,
          avatar: "/mock/path/image.jpg",
        };
      });
      await appController.deleteAvtaarById("1");
      expect(fs_promises.unlink).toHaveBeenCalledTimes(1);
    });

    it("should throw 404 error if avatar not found", async () => {
      mockUserAvtaarModel.findOne = jest.fn().mockImplementationOnce(() => {
        return null;
      });
      await expect(appController.deleteAvtaarById("1")).rejects.toThrow(
        "Not Found"
      );
    });
  });
});
