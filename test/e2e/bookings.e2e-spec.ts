import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module'
import { Types } from 'mongoose';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get authentication token (you need to implement this based on your auth system)
    // const loginResponse = await request(app.getHttpServer())
    //   .post('/auth/login')
    //   .send({ email: 'test@example.com', password: 'password' });
    // authToken = loginResponse.body.access_token;
  });

  it('/bookings (POST) should create a booking', () => {
    const createBookingDto = {
      roomId: new Types.ObjectId().toString(),
      startDate: new Date(),
      endDate: new Date(),
    };

    return request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createBookingDto)
      .expect(201)
      .expect((response) => {
        expect(response.body).toHaveProperty('_id');
        expect(response.body.roomId).toBe(createBookingDto.roomId);
      });
  });

  it('/bookings/my-bookings (GET) should return user bookings', () => {
    return request(app.getHttpServer())
      .get('/bookings/my-bookings')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((response) => {
        expect(Array.isArray(response.body)).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});