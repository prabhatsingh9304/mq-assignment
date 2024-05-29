import { Injectable, Logger } from "@nestjs/common";
import amqp from "amqp-connection-manager";

@Injectable()
export class RabbitMQService {
  async send(msg) {
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await connection.createChannel();
      const result = await channel.assertQueue(process.env.RABBITMQ_QUEUE_NAME);
      channel.sendToQueue(
        process.env.RABBITMQ_QUEUE_NAME,
        Buffer.from(JSON.stringify(msg))
      );
      console.log("User Created msg send successfully");
    } catch (ex) {
      console.log("Fail to send msg to rabbitmq:" + ex);
    }
  }
}
