import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "./schemas/user.schema";
import { Model } from "mongoose";
import { UserAvtaar } from "./schemas/userAvtaar.schema";

@Injectable()
export class AppService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserAvtaar.name) private userAvtaarModel: Model<UserAvtaar>
  ) {}

  async createUser(userDetails: User): Promise<UserDocument> {
    const user = new this.userModel(userDetails);
    return await user.save();
  }

  async saveAvatar(userId: string, avatar: string): Promise<void> {
    await new this.userAvtaarModel({ userId, avatar }).save();
  }

  async getAvatar(userId: string): Promise<string> {
    const userAvtaar = await this.userAvtaarModel.findOne({ userId });
    return userAvtaar?.avatar;
  }

  async removeAvatar(userId: string): Promise<void> {
    await this.userAvtaarModel.findOneAndDelete({ userId });
  }
}
