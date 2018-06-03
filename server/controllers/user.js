import Express from 'express';

import requireAuthenticated from 'helpers/requireAuthenticated';
import { getGitHubLastCommitDate } from 'helpers/github';

const router = Express.Router();

const GITHUB_COMMIT_PREMIUM_DAYS = 30;
function isWithinDays(date, days) {
  const now = Date.now();
  const secondsSinceLastCommit = (now - date) / 1000;
  const secondsPerMonth = 3600 * 24 * days;
  return secondsSinceLastCommit < secondsPerMonth;
}
export async function isGitHubPremiumEligible(login) {
  const lastCommitDate = await getGitHubLastCommitDate(login);
  // TODO: Store date in user object
  if (!lastCommitDate) {
    return false;
  }
  return isWithinDays(lastCommitDate, GITHUB_COMMIT_PREMIUM_DAYS);
}

router.get('/', requireAuthenticated, async function(req, res) {
  const user = req.user;
  const data = user.data;

  let premium = false;
  if (data.patreon && data.patreon.pledgeAmount >= 100) {
    premium = true;
  }
  if (data.github && data.github.login) {
    premium = await isGitHubPremiumEligible(data.github.login);
  }

  res.json({
    name: data.name,
    avatar: data.avatar,
    premium: premium,
  });
});

export default router;