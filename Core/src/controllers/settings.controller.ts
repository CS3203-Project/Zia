import { Request, Response } from 'express';
import settingsService from '../services/settings.service.js';

/** Admin: full spec + current values, for rendering the settings form. */
export const getSettingsController = async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await settingsService.describe() });
  } catch (error) {
    console.error('Failed to read settings:', error);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
};

/** Admin: update one or more settings. Unknown keys are ignored. */
export const updateSettingsController = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const updated = await settingsService.update(
      req.body ?? {},
      admin?.username || admin?.id?.toString()
    );
    res.json({ success: true, message: 'Settings saved', data: updated });
  } catch (error) {
    // Validation failures are the user's to fix, so surface the message.
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to save settings',
    });
  }
};

/**
 * Public: the subset the frontend needs to enforce limits before uploading.
 * These are not secrets - the server re-checks them anyway - and the client
 * needs them to show accurate messages instead of hardcoded numbers.
 */
export const getPublicSettingsController = async (_req: Request, res: Response) => {
  try {
    const all = await settingsService.getAll();
    res.json({
      success: true,
      data: {
        maxUploadSizeMb: all.maxUploadSizeMb,
        maxServiceImages: all.maxServiceImages,
        allowCashPayments: all.allowCashPayments,
        platformFeePercent: all.platformFeePercent,
        minPayoutAmount: all.minPayoutAmount,
      },
    });
  } catch (error) {
    console.error('Failed to read public settings:', error);
    res.status(500).json({ success: false, message: 'Failed to load settings' });
  }
};

/** Internal: used by the payment service to price the platform commission. */
export const getInternalSettingsController = async (_req: Request, res: Response) => {
  try {
    res.json(await settingsService.getAll());
  } catch (error) {
    console.error('Failed to read settings:', error);
    res.status(500).json({ message: 'Failed to load settings' });
  }
};
