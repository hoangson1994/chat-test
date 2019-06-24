import { DeviceTokenMiddleware } from './device-token.middleware';

describe('DeviceTokenMiddleware', () => {
  it('should be defined', () => {
    expect(new DeviceTokenMiddleware()).toBeDefined();
  });
});
