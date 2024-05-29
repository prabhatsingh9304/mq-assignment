import { Injectable, Logger } from "@nestjs/common";
import { MailerService } from "@nestjs-modules/mailer";
@Injectable()
export class MailService {
  constructor(private readonly mailService: MailerService) {}

  async sendMail() {
    let mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: process.env.EMAIL_TO,
      subject: "User Created",
      text: "User is successfully created",
    };

    try {
      await this.mailService.sendMail(mailOptions);
      console.log("User created email sent successfully");
    } catch (error) {
      console.log("Failed to send email: " + error);
    }
  }
}
