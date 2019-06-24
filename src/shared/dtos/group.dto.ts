import { IsArray, IsNotEmpty } from 'class-validator';

export class GroupDto {
  @IsNotEmpty()
  name: string;
  @IsArray()
  members: string[];
}
