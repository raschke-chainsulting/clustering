// define a cluster object
interface Cluster {
  id: number;
  users: string[];
}

/**
 * A clustering algorithm which finds similar users based on their data. The algorithm goes through each user and compares
 * each transfer value with the corresponding value of all other users. If the difference between the two values is smaller
 * than the given match range, the users are considered to be similar. If a two users have at least the given amount of matches
 * for all values, they are considered to be partners (similar). All partners of a user are then considered to be in the same cluster.
 * @param nrOfClusters The number of clusters to create.
 * @param parsedMatchRange The parsed match range. It defines the range in which two values are considered a match.
 * This is an optional parameter which will parsed in recursive calls.
 * @param parsedRequiredMatches The parsed required matches. It defines the amount of matches required to be considered
 * a partner (similar user). This is an optional parameter which will parsed in recursive calls.
 * @param tooLow Indicating if the last matching parameters have been too low. This is an optional parameter which will
 * parsed in recursive calls to avoid infinite loops.
 * @param adjuster The adjuster for the match range and required matches. This is an optional parameter which will
 * parsed in recursive calls to avoid infinite loops.
 */
const clusterAlgorithm = (
  nrOfClusters: number,
  parsedMatchRange?: number,
  parsedRequiredMatches?: number,
  tooLow?: boolean,
  adjuster?: number
) => {
  // user labels
  const labels: Array<string> = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
  ];

  // the given data for all users transactions
  const totalData: Array<Array<number>> = [
    [2, 5, 0, 6, 0, 4, 0],
    [3, 0, 3, 0, 0, 0, 3],
    [0, 0, 0, 0, 6, 0, 8],
    [4, 2, 0, 7, 0, 3, 0],
    [3, 0, 4, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 9, 7],
    [0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 8, 9],
    [94, 87, 75, 101, 2, 54, 62],
    [5, 6, 1, 8, 0, 3, 1],
  ];

  // parameters for the matching algorithm
  let matchRange = parsedMatchRange ?? 10; // range for values to be matched (i.e. x - matchRange <= y <= x + matchRange)
  let requiredMatches = parsedRequiredMatches ?? 3; // number of required value matches to be in the same cluster

  // Finds partners for each user. A partner is a user which has at least the given
  // amount of matches in the given range for each value.
  const allPartners = findPartners(totalData, matchRange, requiredMatches);

  // Creates clusters from a given array of partners. A cluster is an array of a users
  // partners and all partners of the partners.
  const clusters = createClusters(allPartners);

  // Creates cluster ids for the detected clusters.
  const clusterIds = getClusterIds(clusters);
  const detectedClusters: number = Math.max.apply(Math, clusterIds);

  // If the number of detected clusters is not equal to the number of targetted clusters,
  // the algorithm is called recursively with adjusted parameters matching parameters.
  if (detectedClusters < nrOfClusters) {
    // adjust the matching parameters if the number of detected clusters is too low
    // and call the algorithm recursively to find more clusters
    const newAdjuster = adjuster ? (tooLow ? adjuster : adjuster / 2) : 1;
    matchRange = matchRange - newAdjuster;
    requiredMatches = requiredMatches < 6 ? requiredMatches + 1 : 6;
    clusterAlgorithm(
      nrOfClusters,
      matchRange,
      requiredMatches,
      true,
      newAdjuster
    );
  } else if (detectedClusters > nrOfClusters) {
    // adjust the matching parameters if the number of detected clusters is too high
    // and call the algorithm recursively to find less clusters
    const newAdjuster = adjuster ? (!tooLow ? adjuster : adjuster / 2) : 1;
    matchRange = matchRange + newAdjuster;
    requiredMatches = requiredMatches > 1 ? requiredMatches - 1 : 1;
    clusterAlgorithm(
      nrOfClusters,
      matchRange,
      requiredMatches,
      false,
      newAdjuster
    );
  } else {
    // create cluster objects for each detected cluster with id and users
    const clusters: Array<Cluster> = [];
    for (let i = 0; i < detectedClusters; i++) {
      clusters.push({ id: i + 1, users: [] });
    }

    // assign users to their clusters
    for (let i = 0; i < clusterIds.length; i++) {
      clusters[clusterIds[i] - 1].users.push(labels[i]);
    }

    // log the clusters to console
    console.log(clusters);
  }
};

/**
 * Finds all partners for a given array of data. A partner is a user which has
 * at least the given amount of matches in the given range for each value.
 * @param totalData The array of data to find partners for.
 * @param matchRange The maximum difference between two values to be matched.
 * @param requiredMatches The amount of matches required to qualify as a partner.
 * @returns An array of arrays containing the partners for each user.
 */
const findPartners = (
  totalData: Array<Array<number>>,
  matchRange: number,
  requiredMatches: number
): Array<Array<number>> => {
  const allPartners: Array<Array<number>> = [];

  // loop through all users in the data array
  for (let i = 0; i < totalData.length; i++) {
    const userData: Array<number> = totalData[i]; // array of data for a single user
    const matches: Array<number> = []; // array of users which data matches the current user data

    // loop through all user data entries
    for (let j = 0; j < userData.length; j++) {
      // loop again through all users in total data
      for (let k = 0; k < totalData.length; k++) {
        if (k !== i) {
          const otherUserData = totalData[k];

          // compare the data values of the two users
          if (
            otherUserData[j] <= userData[j] + matchRange &&
            otherUserData[j] >= userData[j] - matchRange
          ) {
            matches.push(k); // add the users index to the matches array if the value is in range
          }
        }
      }
    }

    // storing all matching users to a user
    // array of similar users
    const partners: Array<number> = [];

    // register new found cluster for outlier
    // loupe through all found matches
    for (let m = 0; m < matches.length; m++) {
      const match = matches[m];

      // check if the user is already in the partners array
      if (!partners.includes(match)) {
        let matchesWithOtherUser = 1; // number of found data matches for userA and userB

        // loupe through all other matches
        for (let n = 0; n < matches.length; n++) {
          // compare matches to get count of userA and userB matches for all data entries
          if (m !== n && match == matches[n]) {
            matchesWithOtherUser++;
          }
        }

        if (matchesWithOtherUser >= requiredMatches) {
          // add user to partners array if there are more than 3 matches
          partners.push(match);
        }
      }
    }
    allPartners.push(partners);
  }
  return allPartners;
};

/**
 * Creates clusters from a given array of partners. A cluster is an array of a users
 * partners and all partners of the partners.
 * @param allPartners The array of partners from all users to create clusters from.
 * @returns An array of clusters for each user.
 */
const createClusters = (
  allPartners: Array<Array<number>>
): Array<Array<number>> => {
  const clusters: Array<Array<number>> = [];

  // loupe through all users and get their partners
  for (let i = 0; i < allPartners.length; i++) {
    const userPartners = allPartners[i];
    let cluster = userPartners;

    // loupe through all partners of a user
    for (let j = 0; j < userPartners.length; j++) {
      cluster = cluster.concat(allPartners[userPartners[j]]);
    }
    clusters.push(removeDuplicates(cluster));
  }
  return clusters;
};

/**
 * Gets an array of cluster ids for a given array of clusters.
 * @param clusters The clusters to get the ids from.
 * @returns The array of cluster ids.
 */
const getClusterIds = (clusters: Array<Array<number>>): Array<number> => {
  let clusterId = 2;
  const clusterIds: Array<number> = [1];
  // loupe through all found clusters
  for (let i = 1; i < clusters.length; i++) {
    const cluster = clusters[i];
    // push a new cluster id if the cluster is an outlier
    if (cluster.length == 0) {
      clusterIds.push(clusterId);
      clusterId++;
    } else {
      // loupe through all clusters already assigned an id
      for (let j = 0; j < i; j++) {
        // push the cluster id of the first cluster which has the same elements
        if (haveSameElements(clusters[j], cluster)) {
          clusterIds.push(clusterIds[j]);
          break;
        } else {
          // push a new cluster id if the cluster is not the same as the previous ones
          if (j == i - 1) {
            clusterIds.push(clusterId);
            clusterId++;
          }
        }
      }
    }
  }
  return clusterIds;
};

/**
 * Removes duplicate values from a given number array.
 * @param array The array to remove duplicates from.
 * @returns The array without duplicates.
 */
const removeDuplicates = (array: Array<number>): Array<number> => {
  return array.filter((value: number, index: number, self: Array<number>) => {
    return self.indexOf(value) === index;
  });
};

/**
 * Checks if two given number arrays hold the same values.
 * @param array1 The first array to compare.
 * @param array2 The second array to compare.
 * @returns If the two arrays hold the same values.
 */
const haveSameElements = (
  array1: Array<number>,
  array2: Array<number>
): boolean => {
  let result =
    array1.length === array2.length &&
    array1.every((element) => {
      return array2.includes(element);
    });
  return result;
};

clusterAlgorithm(4);
