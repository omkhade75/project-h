import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { MongodbModule } from './mongodb/mongodb.module';
import { AuthController } from './controllers/auth.controller';
import { ProductController } from './controllers/product.controller';
import { SalesController } from './controllers/sales.controller';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { SalesService } from './services/sales.service';
import { AuditService } from './services/audit.service';

@Module({
  imports: [DatabaseModule, MongodbModule],
  controllers: [AppController, AuthController, ProductController, SalesController],
  providers: [AppService, AuthService, ProductService, SalesService, AuditService],
})
export class AppModule {}
