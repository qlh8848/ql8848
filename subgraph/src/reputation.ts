import { BigInt } from "@graphprotocol/graph-ts";
import {
  ReputationUpdated,
  ReputationNFTMinted,
} from "../generated/ReputationSystem/ReputationSystem";
import { Reputation } from "../generated/schema";

function getOrCreateReputation(address: string): Reputation {
  let rep = Reputation.load(address);
  if (rep == null) {
    rep = new Reputation(address);
    rep.solverScore = BigInt.fromI32(0);
    rep.creatorScore = BigInt.fromI32(0);
    rep.totalSolved = BigInt.fromI32(0);
    rep.totalCreated = BigInt.fromI32(0);
    rep.totalDisputed = BigInt.fromI32(0);
    rep.hasNFT = false;
  }
  return rep;
}

export function handleReputationUpdated(event: ReputationUpdated): void {
  let address = event.params.user.toHexString();
  let rep = getOrCreateReputation(address);

  rep.solverScore = event.params.solverScore;
  rep.creatorScore = event.params.creatorScore;

  let updateType = event.params.updateType;
  if (
    updateType == "solver_success" ||
    updateType == "solver_auto_released"
  ) {
    rep.totalSolved = rep.totalSolved.plus(BigInt.fromI32(1));
  } else if (updateType == "creator_paid") {
    rep.totalCreated = rep.totalCreated.plus(BigInt.fromI32(1));
  }

  if (
    updateType == "solver_disputed" ||
    updateType == "creator_disputed"
  ) {
    rep.totalDisputed = rep.totalDisputed.plus(BigInt.fromI32(1));
  }

  rep.save();
}

export function handleReputationNFTMinted(event: ReputationNFTMinted): void {
  let address = event.params.user.toHexString();
  let rep = getOrCreateReputation(address);
  rep.hasNFT = true;
  rep.save();
}
