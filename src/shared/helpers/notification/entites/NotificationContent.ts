export class NotificationContent {
  //tslint:disable
  title: string;
  body: string;
  badge: number;
  mutable_content: boolean;
  sound: string;

  constructor(name: string, message: string) {
    this.title = name;
    this.body = message;
    this.badge = 1;
    this.mutable_content = true;
    this.sound = 'default';
  }
}
