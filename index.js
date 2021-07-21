var process = require("process");
var finder = require("findit")(process.argv[2] || ".");
var path = require("path");
var axios = require("axios");
const fs = require("fs");
process.chdir("../MOVIES AND TV");

const getMetaData = async (movieName) => {
  return new Promise(async (resolve, reject) => {
    const { data } = await axios.get(
      `https://api.themoviedb.org/3/search/movie?api_key=65a808e1de41c6756cc5f7b3183112a7&language=en-US&query=${movieName}&page=1&include_adult=true`
    );
    // return data;
    resolve(data);
  });
};

let moviesArray = [];

const getMoviesData = async () => {
  let index = 0;

  await finder.on("directory", async (dir, stat, stop) => {
    var base = path.basename(dir);
    if (base === ".git" || base === "node_modules") stop();
    else {
      if (dir.includes("(")) {
        if (dir.includes("\\")) {
          dir = dir.split("\\")[1];
        }
        let movieNameYear = dir;
        let nameOnly = movieNameYear.split("(")[0];
        moviesArray.push(nameOnly.trim());
        index++;
      }
    }
  });

  finder.on("end", async () => {
    let result = {
      data: [],
    };
    const data = await Promise.all(moviesArray.map(getMetaData));
    result.data.push(data);
    fs.writeFileSync("moviesData.json", JSON.stringify(result), "utf8");
  });
};

try {
  getMoviesData();
} catch (error) {
  console.log(error)
}
