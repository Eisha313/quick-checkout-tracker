import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { CartService } from './cart.service';
import { AnalyticsService } from './analytics.service';
import { PaymentLinkService } from './payment-link.service';

export interface ServiceDependencies {
  prisma: PrismaClient;
  stripe: Stripe;
}

export class ServiceContainer {
  private static instance: ServiceContainer;
  private dependencies: ServiceDependencies;
  private services: Map<string, unknown> = new Map();

  private constructor(dependencies: ServiceDependencies) {
    this.dependencies = dependencies;
  }

  public static getInstance(dependencies?: ServiceDependencies): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer(
        dependencies || {
          prisma,
          stripe,
        }
      );
    }
    return ServiceContainer.instance;
  }

  public static resetInstance(): void {
    ServiceContainer.instance = undefined as unknown as ServiceContainer;
  }

  public getCartService(): CartService {
    const key = 'cartService';
    if (!this.services.has(key)) {
      this.services.set(key, new CartService());
    }
    return this.services.get(key) as CartService;
  }

  public getAnalyticsService(): AnalyticsService {
    const key = 'analyticsService';
    if (!this.services.has(key)) {
      this.services.set(key, new AnalyticsService());
    }
    return this.services.get(key) as AnalyticsService;
  }

  public getPaymentLinkService(): PaymentLinkService {
    const key = 'paymentLinkService';
    if (!this.services.has(key)) {
      this.services.set(key, new PaymentLinkService());
    }
    return this.services.get(key) as PaymentLinkService;
  }

  public getDependencies(): ServiceDependencies {
    return this.dependencies;
  }
}

// Export singleton accessor functions for convenience
export function getCartService(): CartService {
  return ServiceContainer.getInstance().getCartService();
}

export function getAnalyticsService(): AnalyticsService {
  return ServiceContainer.getInstance().getAnalyticsService();
}

export function getPaymentLinkService(): PaymentLinkService {
  return ServiceContainer.getInstance().getPaymentLinkService();
}

export function getServiceDependencies(): ServiceDependencies {
  return ServiceContainer.getInstance().getDependencies();
}
