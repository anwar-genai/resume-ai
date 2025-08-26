import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { checkUsageLimit } from '@/lib/usage';

export async function withUsageControl(
  handler: (request: Request, context?: any) => Promise<Response>,
  type: 'resume' | 'cover'
) {
  return async function(request: Request, context?: any) {
    try {
      // Get authenticated session
      const session = await getAuthSession();
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' }, 
          { status: 401 }
        );
      }

      const userId = (session as any).userId || (session.user as any).id;
      
      // Check usage limits
      const usageCheck = await checkUsageLimit(userId, type);
      
      if (!usageCheck.canProceed) {
        if (usageCheck.isBlocked) {
          return NextResponse.json(
            { 
              error: 'Account blocked',
              reason: usageCheck.blockReason,
              blocked: true
            }, 
            { status: 403 }
          );
        }
        
        const typeLabel = type === 'resume' ? 'resume' : 'cover letter';
        const remaining = type === 'resume' ? usageCheck.remainingResumes : usageCheck.remainingCovers;
        
        return NextResponse.json(
          { 
            error: `Monthly ${typeLabel} limit reached`,
            usage: {
              remaining,
              periodEnd: usageCheck.periodEnd,
              type: typeLabel
            },
            limitReached: true
          }, 
          { status: 429 }
        );
      }

      // Add usage info to the request context
      (request as any).usage = usageCheck;
      (request as any).userId = userId;

      // Proceed with the original handler
      return await handler(request, context);
      
    } catch (error) {
      console.error('Usage control middleware error:', error);
      return NextResponse.json(
        { error: 'Usage control error' }, 
        { status: 500 }
      );
    }
  };
}

export function createUsageControlledHandler(
  handler: (request: Request, context?: any) => Promise<Response>,
  type: 'resume' | 'cover'
) {
  return withUsageControl(handler, type);
}
