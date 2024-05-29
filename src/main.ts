import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
// import { MicroserviceOptions, Transport } from "@nestjs/microservices";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  if (!process.env.PORT) {
    console.warn("PORT is not defined, using default port 3000");
  }
  
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
