import { IsNotEmpty } from 'class-validator';

export class RenameGroupDto {
  @IsNotEmpty()
  room: string;
  @IsNotEmpty()
  name: string;
}
