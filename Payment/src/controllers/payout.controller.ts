import type { Request, Response } from 'express';
import { upsertPayoutAccount, getPayoutAccount } from '../services/payoutAccount.service.js';
import payoutService, { PayoutError } from '../services/payout.service.js';
import coreClient from '../services/coreClient.service.js';

function fail(res: Response, error: unknown) {
  if (error instanceof PayoutError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error('Payout error:', error);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

/** Resolves the signed-in user to their provider record. */
async function providerIdFor(req: Request): Promise<string> {
  const userId = (req as any).user?.id;
  if (!userId) throw new PayoutError('Not authenticated', 401);

  const provider = await coreClient.getProviderByUserId(userId);
  if (!provider) throw new PayoutError('Only service providers can request payouts', 403);
  return provider.id;
}

class PayoutController {
  /** Provider: current balance plus the minimum withdrawal. */
  async getMyEarnings(req: Request, res: Response) {
    try {
      const providerId = await providerIdFor(req);
      const [earnings, minimum] = await Promise.all([
        payoutService.getEarnings(providerId),
        payoutService.getMinimumPayout(),
      ]);
      res.json({ success: true, data: { ...earnings, minimumPayout: minimum } });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Provider: request a withdrawal. */
  async requestPayout(req: Request, res: Response) {
    try {
      const providerId = await providerIdFor(req);
      const { amount, payoutMethod, note } = req.body ?? {};
      const request = await payoutService.requestPayout(
        providerId,
        Number(amount),
        payoutMethod,
        note
      );
      res.status(201).json({
        success: true,
        message: 'Withdrawal requested. An admin will review it shortly.',
        data: request,
      });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Provider: their own payout history. */
  async listMyPayouts(req: Request, res: Response) {
    try {
      const providerId = await providerIdFor(req);
      res.json({ success: true, data: await payoutService.listForProvider(providerId) });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Admin: every payout request, newest pending first. */
  async listAll(req: Request, res: Response) {
    try {
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json({ success: true, data: await payoutService.listAll(status) });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Admin: mark a request as paid out. */
  async approve(req: Request, res: Response) {
    try {
      const by = req.admin?.username || String(req.admin?.id ?? 'admin');
      const updated = await payoutService.approve(String(req.params.id), by);
      res.json({ success: true, message: 'Payout marked as paid', data: updated });
    } catch (error) {
      fail(res, error);
    }
  }

  /** Admin: decline and return the funds to the provider's balance. */
  async reject(req: Request, res: Response) {
    try {
      const by = req.admin?.username || String(req.admin?.id ?? 'admin');
      const updated = await payoutService.reject(
        String(req.params.id),
        by,
        req.body?.reason
      );
      res.json({ success: true, message: 'Payout rejected and funds returned', data: updated });
    } catch (error) {
      fail(res, error);
    }
  }

  /** The provider's own payout destination, returned masked. */
  async getAccount(req: Request, res: Response) {
    try {
      const providerId = await providerIdFor(req);
      res.json({ success: true, data: await getPayoutAccount(providerId) });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load payout account',
      });
    }
  }

  async saveAccount(req: Request, res: Response) {
    try {
      const providerId = await providerIdFor(req);
      const saved = await upsertPayoutAccount(providerId, req.body ?? {});
      res.json({ success: true, data: saved });
    } catch (error) {
      const status = (error as { status?: number })?.status ?? 500;
      res.status(status).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save payout account',
      });
    }
  }
}

export default new PayoutController();
