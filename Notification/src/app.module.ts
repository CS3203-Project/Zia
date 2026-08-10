// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './modules/email/email.module';
import { QueueModule } from './modules/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigService available throughout the app
    }),
    // TypeORM Configuration - No Auto-Migration Mode
    // This configuration prevents TypeORM from automatically modifying the database schema
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,   // ❌ Disable automatic schema synchronization
        migrationsRun: false, // ❌ Disable automatic migration execution
        migrations: [],       // ❌ No migrations array (since you don't want TypeORM to handle them)
        // SSL is required for cloud Postgres (e.g. NeonDB) but unsupported by a plain
        // local Postgres container - default off, opt in via DATABASE_SSL=true.
        ssl: configService.get('DATABASE_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false, // Optional: Control logging
      }),
    }),
    EmailModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}