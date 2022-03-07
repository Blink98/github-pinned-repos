const express = require("express");
const cheerio = require("cheerio");
const axios = require("axios");
const capitalize = require("./util/capitalize");
const stringToBoolean = require("./util/stringToBoolean");

const app = express();

const getRepoImage = (repos) => {
	const requests = repos.map(async (repo) => {
		const { data } = await axios.get(repo.url);
		const $ = cheerio.load(data);
		const repoImage = $("meta[property='og:image']").attr("content");
		return {
			...repo,
			image: repoImage,
		};
	});

	return Promise.all(requests);
};

const getGithubApiData = async (username, repos) => {
	const githubApiUrl = `https://api.github.com/users/${username}/repos`;

	try {
		const { data: ghApiRepos } = await axios.get(githubApiUrl);
		let finalRepos = [];

		ghApiRepos.forEach((ghApiRepo) => {
			repos.forEach((repo) => {
				const ghApiRepoUrl = ghApiRepo.html_url;
				const repoUrl = repo.url;

				if (ghApiRepoUrl.toLowerCase() === repoUrl.toLowerCase()) {
					finalRepos.push({
						...repo,
						ghApiData: ghApiRepo,
					});
				}
			});
		});

    if (finalRepos.length === 0) {
			const msg = `Sorry, but we cannot find any of your pinned repositories in your Github API: https://api.github.com/users/${username}/repos.`;

			repos = [msg, ...repos];
			return repos;
		}

		return finalRepos;
	} catch (error) {
		console.log(error);
		return error;
	}
};

const getPinnedRepos = async (username, needRepoImage=false, needGhApiData=false) => {
	if (!username) return [];
	try {
		const url = `https://github.com/${username}`;
		const { data } = await axios.get(url);
		const $ = cheerio.load(data);
		const pinnedRepos = $(".pinned-item-list-item-content");
		let repos = [];

		pinnedRepos.each((index, element) => {
			const repoName = $(element)
				.find("span.repo[title]")
				.text()
				.replace(/\n/g, "");

			const repoUrl = `${url}/${repoName}`;

			const repoDescription = $(element)
				.find("p.pinned-item-desc")
				.text()
				.replace(/\s\s+/g, "");

			repos.push({
				name: capitalize(repoName.replace(/-/g, " ")),
				url: repoUrl,
				description: repoDescription,
			});
		});

		if (needRepoImage && needGhApiData) {
			// If user wants the social preview and GitHub API data
			repos = await getRepoImage(repos);
			repos = await getGithubApiData(username, repos);
			return repos;
		} else if (needRepoImage) {
			// If user only wants the social preview
			repos = await getRepoImage(repos);
			return repos;
		} else if (needGhApiData) {
			// If only wants GitHub API data
			repos = await getGithubApiData(username, repos);
			return repos;
		}

		return repos;
	} catch (error) {
		if (error.response.status === 404)
			return {
				status: 404,
				msg: `No Github profile with this username: https://github.com/${username}`,
			};
		return error;
	}
};

app.get("/", async (req, res) => {
	res.sendFile(__dirname + "/index.html");
});

app.get("/:username", async (req, res) => {
	const result = await getPinnedRepos(
		req.params.username,
		stringToBoolean(req.query.needRepoImage),
		stringToBoolean(req.query.needGhApiData)
	);

	if (result.status === 404) {
		res.status(404).send(result);
	} else {
		res.send(result);
	}
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
