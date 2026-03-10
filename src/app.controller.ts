import { Body, Controller, Get, Post, Headers } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, EventPattern } from "@nestjs/microservices";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }


}
