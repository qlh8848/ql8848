import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { BountyCreated } from "../generated/BountyFactory/BountyFactory";
import { Bounty, PlatformStat } from "../generated/schema";

export function handleBountyCreated(event: BountyCreated): void {
  let bountyId = event.params.bountyId.toString();
  let bounty = new Bounty(bountyId);

  bounty.creator = event.params.creator;
  bounty.bountyAddress = event.params.bountyAddress;
  bounty.reward = event.params.reward;
  bounty.deadline = event.params.deadline;
  bounty.bountyId = event.params.bountyId;
  bounty.questionIpfsHash = "";
  bounty.status = "Open";
  bounty.createdAt = event.block.timestamp;
  bounty.updatedAt = event.block.timestamp;

  bounty.save();

  // Update platform stats
  let stats = PlatformStat.load("platform");
  if (stats == null) {
    stats = new PlatformStat("platform");
    stats.totalBounties = BigInt.fromI32(0);
    stats.totalResolved = BigInt.fromI32(0);
    stats.totalRewardPool = BigInt.fromI32(0);
  }
  stats.totalBounties = stats.totalBounties.plus(BigInt.fromI32(1));
  stats.totalRewardPool = stats.totalRewardPool.plus(event.params.reward);
  stats.save();
}
