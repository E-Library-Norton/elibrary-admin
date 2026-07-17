'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { billingInfoContent } from '@/config/infoconfig';

export default function BillingPage() {
  // Mock organization
  const organization = { name: 'Main Workspace', id: '1' };
  const isLoaded = true;

  // Mock billing data
  const plans = [
    { id: 'free', name: 'Free', price: '$0', features: ['Basic features', 'Up to 5 projects'] },
    { id: 'pro', name: 'Pro', price: '$29/mo', features: ['All features', 'Unlimited projects', 'Priority support'] },
    { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Everything', 'Dedicated support', 'Custom features'] }
  ];

  return (
    <PageContainer
      isloading={!isLoaded}
      access={!!organization}
      accessFallback={
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='space-y-2 text-center'>
            <h2 className='text-2xl font-semibold'>No Organization Selected</h2>
            <p className='text-muted-foreground'>
              Please select or create an organization to view billing
              information.
            </p>
          </div>
        </div>
      }
      infoContent={billingInfoContent}
      pageTitle='Billing & Plans'
      pageDescription={`Manage your subscription and usage limits for ${organization?.name}`}
    >
      <div className='space-y-6'>
        {/* Info Alert */}
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            Plans and subscriptions are managed through your account. Select a plan to unlock features and higher limits.
          </AlertDescription>
        </Alert>

        {/* Pricing Plans */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose a plan that fits your organization's needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid gap-6 md:grid-cols-3'>
              {plans.map((plan) => (
                <Card key={plan.id} className='flex flex-col'>
                  <CardHeader>
                    <CardTitle className='text-lg'>{plan.name}</CardTitle>
                    <p className='text-2xl font-bold mt-2'>{plan.price}</p>
                  </CardHeader>
                  <CardContent className='flex-grow'>
                    <ul className='space-y-2'>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className='text-sm text-muted-foreground'>✓ {feature}</li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className='p-6 pt-0'>
                    <button className='w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'>
                      Subscribe
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
