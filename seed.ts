import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';
import { UserRole } from './src/shared/utils/user-role.enum';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const usersService = app.get(UsersService);

    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'MyStrongPass!';

    console.log('Starting the seeding process...');

    try {
        // Перевіримо, чи вже існує адмін
        const existingAdmin = await usersService.findByEmail(adminEmail);
        if (existingAdmin) {
            console.log('Admin user already exists:', existingAdmin.email);
        } else {
            // Додамо нового адміністратора
            const newAdmin = await usersService.createUser(adminEmail, adminPassword, UserRole.ADMIN);
            console.log('Admin user created successfully:', newAdmin.email);
        }
    } catch (error) {
        console.error('Error during the seeding process:', error.message);
    } finally {
        await app.close();
    }

    console.log('Seeding process completed.');
}

bootstrap();
