import { collection, getDocs, getFirestore } from "firebase/firestore";

// This function is responsible for matching donations to organizations based on various criteria.
export async function matchDonations() {
  console.log("Starting matchDonations function"); // Logs the start of the matchDonations function.

  const db = getFirestore(); // Initializes the Firestore database instance.

  // Fetch all organizations from the "Associations" collection in Firestore.
  const orgCollection = collection(db, "Associations");
  const orgSnapshot = await getDocs(orgCollection); // Retrieves all documents in the "Associations" collection.
  const organizations = orgSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })); // Maps each document to an object containing its ID and data.

  console.log("Fetched organizations:", organizations); // Logs the fetched organizations.

  // Fetch all donations from the "DataDonations" collection in Firestore.
  const donationCollection = collection(db, "DataDonations");
  const donationSnapshot = await getDocs(donationCollection); // Retrieves all documents in the "DataDonations" collection.
  const donations = donationSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })); // Maps each document to an object containing its ID and data.

  console.log("Fetched donations:", donations); // Logs the fetched donations.

  // Iterate through each organization to find the best matching donations.
  const matches = organizations.map((org) => {
    // Initialize an object to hold the best matches for each donation request category.
    let bestMatchesPerCategory = {};

    // Iterate over each donation request category for the current organization.
    org.donationRequest.forEach((category) => {
      // Filter donations based on the current category
      let categoryMatches = donations
        .filter(
          (donation) =>
            donation.category.toLowerCase() === category.toLowerCase()
        )
        .map((donation) => ({
          organization: org,
          donor: donation,
          score: calculateMatchScore(org, donation),
        })); // Map each matching donation to an object containing the organization, donor, and a match score.

      // Find the best match for this category by comparing the scores.
      const bestMatchForCategory = categoryMatches.reduce((best, current) => {
        return current.score > (best?.score || 0) ? current : best;
      }, null); // Reduce the list to the donation with the highest score.

      // Store the best match for the current category.
      if (bestMatchForCategory) {
        bestMatchesPerCategory[category] = bestMatchForCategory;
      }
    });

    // Combine all the best matches into a single array.
    const combinedMatches = Object.values(bestMatchesPerCategory);

    // Return an object containing the organization and its matches.
    return { org, matches: combinedMatches, bestMatch: combinedMatches };
  });

  console.log("All matches calculated:", matches); // Logs all calculated matches.
  return matches; // Return the calculated matches.
}

// This function calculates a score for how well a donation matches an organization's needs.
function calculateMatchScore(org, donation) {
  let score = 0; // Initialize the score to zero.

  // Add points to the score if the donation is from the same district as the organization.
  if (donation.district === org.district) {
    score += 10;
  }

  // Add points to the score if the donation's category matches the organization's request.
  if (org.donationRequest.includes(donation.category.toLowerCase())) {
    score += 20;
  }

  return score; // Return the calculated score.
}
