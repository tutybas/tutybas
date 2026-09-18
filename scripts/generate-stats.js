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
    throw new Error(`GitHub API: ${response.status} ${await response.text()}`);
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
  const user = await github(`https://api.github.com/users/${username}`);
  const repos = await getAllRepos();

  const stars = repos.reduce(
    (total, repo) => total + repo.stargazers_count,
    0
  );

  // Conta commits feitos pelo usuário nos próprios repositórios públicos.
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

      if (me) commits += me.contributions;
    } catch (error) {
      console.log(`Não foi possível contar ${repo.name}`);
    }
  }

  // Repositórios públicos informados pelo próprio GitHub.
  const repositoryCount = user.public_repos;

  /*
   * "Contribuiu para" não possui uma contagem simples e confiável
   * pela API REST pública. Por enquanto mostramos repositórios externos
   * encontrados entre os repositórios acessíveis pelo token.
   */
  const contributedTo = repos.filter(
    repo =>
      repo.owner.login.toLowerCase() !== username.toLowerCase()
  ).length;

  const svg = `
<svg width="495" height="195" viewBox="0 0 495 195"
     fill="none"
     xmlns="http://www.w3.org/2000/svg">

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
      font: 600 18px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    }

    .label {
      fill: #FFFFFF;
      font: 14px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    }

    .number {
      fill: #FFFFFF;
      font: 600 14px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    }

    .icon {
      fill: #FF4D8D;
      font: 15px -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
    }
  </style>

  <text x="25" y="35" class="title">
    Estatísticas do GitHub de Arthur
  </text>

  <text x="25" y="75" class="icon">★</text>
  <text x="50" y="75" class="label">Total de estrelas:</text>
  <text x="210" y="75" class="number">${stars}</text>

  <text x="270" y="75" class="icon">●</text>
  <text x="295" y="75" class="label">Total de commits:</text>
  <text x="445" y="75" class="number">${commits}</text>

  <text x="25" y="115" class="icon">◆</text>
  <text x="50" y="115" class="label">Repositórios:</text>
  <text x="210" y="115" class="number">${repositoryCount}</text>

  <text x="270" y="115" class="icon">◈</text>
  <text x="295" y="115" class="label">Contribuiu para:</text>
  <text x="445" y="115" class="number">${contributedTo}</text>

</svg>`;

  fs.mkdirSync("profile", { recursive: true });
  fs.writeFileSync("profile/stats.svg", svg.trim());

  console.log("stats.svg atualizado!");
  console.log({
    stars,
    commits,
    repositoryCount,
    contributedTo
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});