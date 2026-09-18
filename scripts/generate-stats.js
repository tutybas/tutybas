const fs = require("fs");

const username = "tutybas";
const token = process.env.GITHUB_TOKEN;

const headers = {
  Authorization: `Bearer ${token}`,
  "User-Agent": "github-readme-stats"
};

async function github(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub API: ${response.status} ${await response.text()}`
    );
  }

  return response.json();
}

async function getAllRepos() {
  let page = 1;
  let repos = [];

  while (true) {
    const data = await github(
      `https://api.github.com/users/${username}/repos?per_page=100&page=${page}`
    );

    repos = repos.concat(data);

    if (data.length < 100) break;
    page++;
  }

  return repos;
}

async function main() {
  const user = await github(
    `https://api.github.com/users/${username}`
  );

  const repos = await getAllRepos();

  // ⭐ ESTRELAS
  const stars = repos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  // 📦 REPOSITÓRIOS
  const repositoryCount = user.public_repos;

  // 🕘 COMMITS
  let commits = 0;

  for (const repo of repos) {
    if (repo.fork) continue;

    try {
      const contributors = await github(
        `https://api.github.com/repos/${username}/${repo.name}/contributors?per_page=100`
      );

      const me = contributors.find(
        contributor =>
          contributor.login?.toLowerCase() === username.toLowerCase()
      );

      if (me) {
        commits += me.contributions;
      }
    } catch {
      console.log(`Não foi possível contar commits de ${repo.name}`);
    }
  }

  // 📖 CONTRIBUIU PARA
  const contributedTo = repos.filter(
    repo =>
      repo.owner.login.toLowerCase() !== username.toLowerCase()
  ).length;

  /*
   * NOTA
   *
   * A nota é apenas uma representação visual baseada
   * nas métricas disponíveis neste card.
   */

  const score =
    commits +
    stars * 20 +
    repositoryCount * 10 +
    contributedTo * 20;

  let grade = "C";

  if (score >= 1500) grade = "S+";
  else if (score >= 1000) grade = "S";
  else if (score >= 750) grade = "A++";
  else if (score >= 500) grade = "A+";
  else if (score >= 300) grade = "A";
  else if (score >= 150) grade = "B+";
  else if (score >= 75) grade = "B";

  const svg = `
<svg
  width="495"
  height="195"
  viewBox="0 0 495 195"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>

  <rect
    x="0.5"
    y="0.5"
    width="494"
    height="194"
    rx="8"
    fill="#0D1117"
    stroke