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
        stroke="#30363D"
  />

  <style>
    .title {
      fill: #FF4D8D;
      font: 600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .label {
      fill: #FFFFFF;
      font: 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .number {
      fill: #FFFFFF;
      font: 600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .icon {
      fill: #FF4D8D;
      font: 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }

    .grade {
      fill: #FFFFFF;
      font: 700 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    }
  </style>

  <text x="25" y="32" class="title">
    Estatísticas do GitHub de Arthur
  </text>

  <text x="25" y="68" class="icon">★</text>
  <text x="50" y="68" class="label">Total de estrelas:</text>
  <text x="220" y="68" class="number">${stars}</text>

  <text x="25" y="96" class="icon">●</text>
  <text x="50" y="96" class="label">Total de commits:</text>
  <text x="220" y="96" class="number">${commits}</text>

  <text x="25" y="124" class="icon">◆</text>
  <text x="50" y="124" class="label">Repositórios:</text>
  <text x="220" y="124" class="number">${repositoryCount}</text>

  <text x="25" y="152" class="icon">◈</text>
  <text x="50" y="152" class="label">Contribuiu para:</text>
  <text x="220" y="152" class="number">${contributedTo}</text>

  <circle
    cx="400"
    cy="105"
    r="47"
    stroke="#4A1F31"
    stroke-width="8"
    fill="none"
  />

  <circle
    cx="400"
    cy="105"
    r="47"
    stroke="#FF4D8D"
    stroke-width="8"
    fill="none"
    stroke-linecap="round"
    stroke-dasharray="190 110"
    transform="rotate(-90 400 105)"
  />

  <text
    x="400"
    y="115"
    text-anchor="middle"
    class="grade"
  >
    ${grade}
  </text>

</svg>
`;

  fs.mkdirSync("profile", { recursive: true });

  fs.writeFileSync(
    "profile/stats.svg",
    svg.trim()
  );

  console.log("stats.svg atualizado!");

  console.log({
    stars,
    commits,
    repositories: repositoryCount,
    contributedTo,
    score,
    grade
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});