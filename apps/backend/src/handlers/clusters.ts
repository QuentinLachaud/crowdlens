/**
 * Cluster API Handlers
 * 
 * Endpoints for claiming clusters and providing feedback.
 */

import type { RouteContext } from '../utils/router';
import { jsonResponse, errorResponse, parseJsonBody } from '../utils/router';
import type { StorageService } from '../storage/types';

export interface ClusterHandlerEnv {
  storage: StorageService;
}

/** Claim cluster request body */
interface ClaimRequest {
  displayName?: string;
  userId?: string;
}

/** Feedback request body */
interface FeedbackRequest {
  feedback: {
    photoId: string;
    isMatch: boolean;
  }[];
}

/**
 * POST /api/clusters/:clusterId/claim
 * 
 * Claim a cluster as belonging to a specific user.
 * Sets the displayName and marks as claimed.
 */
export async function handleClaimCluster(
  ctx: RouteContext<ClusterHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  // Check if already claimed
  if (cluster.claimedBy) {
    return errorResponse(
      'Cluster is already claimed',
      409,
      'ALREADY_CLAIMED'
    );
  }
  
  // Parse request body
  const body = await parseJsonBody<ClaimRequest>(ctx.request);
  
  // Update cluster
  const now = new Date().toISOString();
  const updated = await storage.updateCluster(clusterId, {
    displayName: body?.displayName?.trim() || undefined,
    claimedBy: body?.userId || 'anonymous',
    claimedAt: now,
  });
  
  return jsonResponse({
    success: true,
    message: 'Cluster claimed successfully',
    cluster: {
      id: updated?.id,
      displayName: updated?.displayName,
      claimedAt: updated?.claimedAt,
    },
  });
}

/**
 * PUT /api/clusters/:clusterId
 * 
 * Update cluster properties (displayName, etc.).
 * Only allowed for claimed clusters by the owner.
 */
export async function handleUpdateCluster(
  ctx: RouteContext<ClusterHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  // Parse request body
  const body = await parseJsonBody<{ displayName?: string }>(ctx.request);
  
  if (!body) {
    return errorResponse('Invalid request body', 400, 'INVALID_BODY');
  }
  
  // Update cluster
  const updated = await storage.updateCluster(clusterId, {
    displayName: body.displayName?.trim() || cluster.displayName,
  });
  
  return jsonResponse({
    success: true,
    cluster: {
      id: updated?.id,
      displayName: updated?.displayName,
      tags: updated?.tags,
    },
  });
}

/**
 * POST /api/clusters/:clusterId/feedback
 * 
 * Provide feedback on photo matches.
 * Users can confirm or reject suggested photos.
 */
export async function handleClusterFeedback(
  ctx: RouteContext<ClusterHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  // Parse request body
  const body = await parseJsonBody<FeedbackRequest>(ctx.request);
  
  if (!body?.feedback || !Array.isArray(body.feedback)) {
    return errorResponse(
      'Feedback array is required',
      400,
      'INVALID_FEEDBACK'
    );
  }
  
  // Save each feedback item
  const results: { photoId: string; saved: boolean }[] = [];
  
  for (const item of body.feedback) {
    if (!item.photoId || typeof item.isMatch !== 'boolean') {
      results.push({ photoId: item.photoId || 'unknown', saved: false });
      continue;
    }
    
    // Verify photo exists
    const photo = await storage.getPhoto(item.photoId);
    if (!photo) {
      results.push({ photoId: item.photoId, saved: false });
      continue;
    }
    
    // Save feedback
    await storage.createMatchFeedback(
      clusterId,
      item.photoId,
      item.isMatch
    );
    
    results.push({ photoId: item.photoId, saved: true });
  }
  
  const savedCount = results.filter(r => r.saved).length;
  
  return jsonResponse({
    success: true,
    message: `Saved ${savedCount} of ${body.feedback.length} feedback items`,
    results,
  });
}

/**
 * GET /api/clusters/:clusterId/feedback
 * 
 * Get all feedback for a cluster.
 */
export async function handleGetFeedback(
  ctx: RouteContext<ClusterHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  const feedback = await storage.getFeedbackByCluster(clusterId);
  
  // Aggregate feedback
  const positiveCount = feedback.filter(f => f.isMatch).length;
  const negativeCount = feedback.filter(f => !f.isMatch).length;
  
  return jsonResponse({
    success: true,
    clusterId,
    feedback: feedback.map(f => ({
      photoId: f.photoId,
      isMatch: f.isMatch,
      createdAt: f.createdAt,
    })),
    summary: {
      total: feedback.length,
      positive: positiveCount,
      negative: negativeCount,
    },
  });
}

/**
 * DELETE /api/clusters/:clusterId/claim
 * 
 * Unclaim a cluster (remove ownership).
 */
export async function handleUnclaimCluster(
  ctx: RouteContext<ClusterHandlerEnv>
): Promise<Response> {
  const { clusterId } = ctx.params;
  const { storage } = ctx.env;
  
  const cluster = await storage.getCluster(clusterId);
  if (!cluster) {
    return errorResponse('Cluster not found', 404, 'CLUSTER_NOT_FOUND');
  }
  
  if (!cluster.claimedBy) {
    return errorResponse('Cluster is not claimed', 400, 'NOT_CLAIMED');
  }
  
  // Remove claim
  await storage.updateCluster(clusterId, {
    claimedBy: undefined,
    claimedAt: undefined,
  });
  
  return jsonResponse({
    success: true,
    message: 'Cluster unclaimed',
    clusterId,
  });
}
