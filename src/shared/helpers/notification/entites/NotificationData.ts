export class NotificationData {
  id: string;
  name: string;
  message: string;
  status: number;

  constructor(name: string, message: string, room: string) {
    this.id = room;
    this.name = name;
    this.message = message;
    this.status = 1;
  }
}
