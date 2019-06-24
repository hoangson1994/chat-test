import {MyValidationPipe} from '../pipes/validation.pipe';

export const transformPipe = new MyValidationPipe({transform: true});
export const JWT_SECRET = 'hkjsafhjkafshkjafhkjas812128ajkf';

export const CLIENT_DATE_FORMAT = 'DD/MM/YYYY HH:mm';

export const NOTIFICATION_AUTHORIZATION = 'AIzaSyDQThfKIsyGtj2RpXWTXBY3j0ueUMpQgXo';
export const NOTIFICATION_URL = 'https://fcm.googleapis.com/fcm/send';
