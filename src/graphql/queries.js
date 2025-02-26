import { gql } from "@apollo/client";

export const GET_USER_LATEST_PROJECT = gql`
	query ($userID: Int!) {
		group(
			where: {
				members: { userId: { _eq: $userID } }
				_or: [
					{ eventId: { _eq: 72 } }
					{ event: { parentId: { _eq: 72 } } }
				]
				_and: [{ status: { _neq: finished } }]
			}
			order_by: { updatedAt: desc }
			limit: 1
		) {
			id
			path
			object {
				name
			}
		}
	}
`;

export const GET_USER_INFO = gql`
	query getUserInfo {
		user(limit: 1) {
			id
			firstName
			lastName
			email
			auditRatio
			attrs
			events {
				level
				event {
					id
					path
				}
			}
			labels {
				labelName
			}
			public {
				campus
			}
			transactions_aggregate(
				where: {
					event: { path: { _eq: "/bahrain/bh-module" } }
					type: { _eq: "xp" }
				}
			) {
				aggregate {
					sum {
						amount
					}
				}
			}
		}
	}
`;

export const GET_USER_POSITION = gql`
	query getUserPosition($userID: Int!) {
		event(where: { id: { _eq: 72 } }) {
			id
			registrations {
				users(where: { id: { _eq: $userID } }) {
					id
					position
				}
			}
		}
	}
`;