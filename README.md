# GitHub Pinned Repos

This app provies a REST-API that returns pinned repos and related data of a GitHub's user.

**API endpoint:**  
https://gh-pinned-repos.herokuapp.com/blink98?needRepoImage=true&needGhApiData=true

## The API requires 3 values:

1. **username** of a GitHub user (eg: blink98) will return 3 values: name, url and, description of all the pinned repos. It is a _path parameter_ in the API.

2. **needRepoImage** is a _query parameter_ that takes either **true** or **false** and returns the social preview of all the pinned repos along with the above mentioned values.

3. **needGhApiData** is a _query parameter_ that takes either **true** or **false** and returns the official GitHub data of all the pinned repos (using official GitHub API: https://github.com/[username]/github-pinned-repos).

> You can find in detail tutorial of this app [here](https://singhlify.hashnode.dev/series/nodejs-api-on-cloud).
