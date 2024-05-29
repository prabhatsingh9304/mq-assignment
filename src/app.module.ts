import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./schemas/user.schema";
import { RabbitMQService } from "./rabbitmq.service";
import { UserAvtaar, UserAvtaarSchema } from "./schemas/userAvtaar.schema";
import { MailerModule } from "@nestjs-modules/mailer";
import { MailService } from "./mail.service";
@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: UserAvtaar.name, schema: UserAvtaarSchema },
    ]),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        port: 465,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, RabbitMQService, MailService],
  exports: [MailService],
})
export class AppModule {}
