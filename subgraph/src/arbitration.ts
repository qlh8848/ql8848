import { BigInt } from "@graphprotocol/graph-ts";
import {
  ProposalCreated,
  Voted,
  ArbitrationExecuted,
} from "../generated/ArbitrationDAO/ArbitrationDAO";
import { Proposal } from "../generated/schema";

export function handleProposalCreated(event: ProposalCreated): void {
  let id = event.params.proposalId.toString();
  let proposal = new Proposal(id);

  proposal.bountyId = event.params.bountyId;
  proposal.bountyAddress = event.params.proposer; // placeholder, will be set via contract read if needed
  proposal.proposer = event.params.proposer;
  proposal.evidenceIpfsHash = event.params.evidenceIpfsHash;
  proposal.yesVotes = BigInt.fromI32(0);
  proposal.noVotes = BigInt.fromI32(0);
  proposal.deadline = event.block.timestamp.plus(BigInt.fromI32(259200)); // 3 days
  proposal.executed = false;
  proposal.status = "Active";
  proposal.createdAt = event.block.timestamp;

  proposal.save();
}

export function handleVoted(event: Voted): void {
  let id = event.params.proposalId.toString();
  let proposal = Proposal.load(id);
  if (proposal == null) return;

  if (event.params.support) {
    proposal.yesVotes = proposal.yesVotes.plus(BigInt.fromI32(1));
  } else {
    proposal.noVotes = proposal.noVotes.plus(BigInt.fromI32(1));
  }

  proposal.save();
}

export function handleArbitrationExecuted(event: ArbitrationExecuted): void {
  let id = event.params.proposalId.toString();
  let proposal = Proposal.load(id);
  if (proposal == null) return;

  proposal.executed = true;
  proposal.status = "Executed";
  proposal.yesVotes = event.params.yesVotes;
  proposal.noVotes = event.params.noVotes;

  proposal.save();
}
