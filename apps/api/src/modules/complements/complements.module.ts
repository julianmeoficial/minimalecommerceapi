import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';

@Module({
  controllers: [
    CouponsController,
    ReviewsController,
    FavoritesController,
    ContentController,
    FeatureFlagsController,
  ],
  providers: [
    CouponsService,
    ReviewsService,
    FavoritesService,
    ContentService,
    FeatureFlagsService,
  ],
  exports: [CouponsService, FeatureFlagsService],
})
export class ComplementsModule {}
