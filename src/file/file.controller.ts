import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

@Controller('file')
export class FileController {
  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file, @Body() body) {
    const { type } = body;
    const { buffer } = file;
    await fs.outputFile(
      path.join(os.homedir(), '/projects/main/static', type, 'group.jpg'),
      buffer,
    );

    return null;
  }
}
