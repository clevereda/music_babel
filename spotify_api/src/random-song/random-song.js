import React, { Component } from "react";
import { TextField, Button, Paper, Select, MenuItem } from "@material-ui/core";
import Rating from '@material-ui/lab/Rating';
import axios from "axios";
import swal from "sweetalert";
import { connect } from "react-redux";
import "../App.css";
//source in spotify api framework
import Spotify from "spotify-web-api-js";
//define class of new Spotify into spotifyWebApi
const spotifyWebApi = new Spotify();

class RandomSong extends Component {
  //saving in constructor, required for spotify api use
  constructor() {
    super();
    //saves getHashParams in params varable
    const params = this.getHashParams();
    //default state
    this.state = {
      username: "",
      rate: null,
      loggedIn: params.access_token ? true : false,
      nowPlaying: {
        name: "",
        artist: "",
        album: "",
        image:
          "https://image.shutterstock.com/image-vector/music-note-icon-vector-260nw-415866139.jpg",
      },
      randomSong: {
        artist: "artist",
        album: "album",
        song: "song",
        image:
          "https://image.shutterstock.com/image-vector/music-note-icon-vector-260nw-415866139.jpg",
        id: "id",
      },
      relatedArtists: {
        artists: [],
      },
    };
    //if no access token exists, refresh token
    if (params.access_token) {
      spotifyWebApi.setAccessToken(params.access_token);
    }
  }
  componentDidMount() {
    this.props.dispatch({ type: "FETCH_MUSIC" });
  }
  //generates new token
  getHashParams() {
    var hashParams = {};
    var e,
      r = /([^&;=]+)=?([^&;]*)/g,
      q = window.location.hash.substring(1);
    while ((e = r.exec(q))) {
      hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }

  //function to generate random queue
  getRandomSearch = () => {
    // A list of all characters that can be chosen.
    const characters = "abcdefghijklmnopqrstuvwxyz";

    // Gets a random character from the characters string.
    const randomCharacter = characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
    let randomSearch = "";

    // Places the wildcard character at the beginning, or both beginning and end, randomly.
    switch (Math.round(Math.random())) {
      case 0:
        randomSearch = randomCharacter + "%";
        break;
      case 1:
        randomSearch = "%" + randomCharacter + "%";
        break;
    }

    return randomSearch;
  };
  //function to call random song
  randomSong() {
    //list of all valid country codes that spotify utilizes. Needs to be randomized or spotify will always
    //use users default country code and result won't truly be random
    let countries = [
      "AD",
      "AR",
      "AU",
      "AT",
      "BE",
      "BO",
      "BR",
      "BG",
      "CL",
      "CO",
      "CR",
      "CY",
      "CZ",
      "DK",
      "DO",
      "EC",
      "SV",
      "EE",
      "FI",
      "FR",
      "DE",
      "GR",
      "GT",
      "HN",
      "HK",
      "HU",
      "IS",
      "IE",
      "IT",
      "LV",
      "LI",
      "LT",
      "LU",
      "MY",
      "MT",
      "MX",
      "MC",
      "NL",
      "NZ",
      "NI",
      "NO",
      "PA",
      "PY",
      "PE",
      "PH",
      "PL",
      "PT",
      "SG",
      "SK",
      "ES",
      "SE",
      "CH",
      "TW",
      "TR",
      "GB",
      "UY",
      "US",
    ];
    //sets random offset number, this picks a random page of the up to 2000 pages that spotify allows
    const randomOffset = Math.floor(Math.random() * 2000);
    //selects random index of 50 items listed on each page.
    const randomIndex = Math.floor(Math.random() * 50);
    //selects random country code from array
    const randomCountry = Math.floor(Math.random() * countries.length);
    //generate search query with random search parameters
    spotifyWebApi
      .searchTracks(this.getRandomSearch(), {
        limit: 50,
        offset: randomOffset,
        market: countries[randomCountry],
      })
      .then((response) => {
        console.log(
          "randomSong",
          response.tracks.items[randomIndex].external_urls.spotify
        );
        this.setState({
          randomSong: {
            artist: response.tracks.items[randomIndex].artists[0].name, //artist
            album: response.tracks.items[randomIndex].album.name, //album
            song: response.tracks.items[randomIndex].name, //song
            image: response.tracks.items[randomIndex].album.images[0].url, //album artwork
            id: response.tracks.items[randomIndex].artists[0].id, //artist id used for similar artists
            open: response.tracks.items[randomIndex].external_urls.spotify, //generates an open link for that track
          },
        });
        //calls related artists function when randomSong is run
        this.getRelatedArtists();
      })
      .catch((error) => {
        console.log("song not found, rerunning");
        //if 404, rerun function
        this.randomSong();
      });
  }
  //generates similar artists to the artist of the random song
  getRelatedArtists() {
    //spotify web api request for getting related artists, plugs in artist id from randomSong function
    spotifyWebApi
      .getArtistRelatedArtists(this.state.randomSong.id)
      .then((response) => {
        //empty array
        let artistsArray = [];
        //...loop through response
        for (let i = 0; i < response.artists.length; i++) {
          const element = response.artists[i];
          //...push response to array
          artistsArray.push(element.name);
        }
        //...set state with array information
        this.setState({
          relatedArtists: {
            artists: artistsArray,
          },
        });
      });
  }

  handleChange = (event, fieldName) => {
    this.setState({ [fieldName]: event.target.value }); //sets to value of targeted event
  }; //end handleChange

  addNewRecommendation = (event) => {
    //prevents default action
    event.preventDefault();

    //grabs all keys in Redux state
    const { username } = this.props.user;
    const { song } = this.state.randomSong
    //sweet alerts
    swal({
      //confirmation page exists in sweet alerts notification
      title: "You're rating?",
      text: `${this.props.user.username}'s rating
        You are giving ${song} a rating of ${this.state.rate}
        click "ok" to confirm`,
      icon: "info",
      buttons: true,
      dangerMode: true,
      //end sweet alerts
    }).then((confirm) => {//start .then
      if (confirm) {
        if(this.state.rate < 3) {
          this.randomSong();
          swal("Thank you for your feedback. Grabbing new random song now")
        } else {
        axios({ //start axios
          method: "POST",
          url: "/music",
          data: {
            username: username,
            song: this.state.randomSong.song,
            artist: this.state.randomSong.artist,
            album: this.state.randomSong.album,
          }
          //data from local state to POST
        }) //end axios
          .then((response) => {// start .then
            this.props.dispatch({ type: "FETCH_MUSIC" });
          }) //end .then
          .catch((error) => { //start .catchError
            console.log(error);
          }); //end .catchError
        //success! Info POSTED to database
        swal("Glad to hear you liked this song. It will be saved to the recommendations list with your rating!", {
          icon: "success",
        });
        this.forceUpdate();
        setTimeout(() => {
          this.rate();
        }, 1500);
      };
        //...else canceled
      } else {
        swal("Your rating submission was canceled!");
      }
    })
  };


  rate = (event) => {

    //grabs all keys in Redux state
    const { music } = this.props;
    const { rate } = this.state
        axios({ //start axios
          method: "POST",
          url: "/music/rate",
          data: {
            id: this.props.music[this.props.music.length - 1] && this.props.music[this.props.music.length - 1].id[0],
            rate: rate,
          }
          //data from local state to POST
        }) //end axios
          .then((response) => {// start .then
            this.props.dispatch({ type: "FETCH_MUSIC" });
          }) //end .then
          .catch((error) => { //start .catchError
            console.log(error);
          }); //end .catchError
        
    //resets local state
    this.setState({
      rate: null
    })
    window.location.reload(false);
  };
  render() {
    //grabs artists info from getRelatedArtists, saves to varable.
    const { artists } = this.state.relatedArtists;
    return (
      <div className="App">
        <h1>RANDOM SONG</h1>
        {/* generates random song */}
        <button onClick={() => this.randomSong()}>Generate Random Song</button>
        <div>Artist: {this.state.randomSong.artist}</div>
        <div>Album: {this.state.randomSong.album}</div>
        <div>Track: {this.state.randomSong.song}</div>
        {JSON.stringify(this.props.music[this.props.music.length - 1] && this.props.music[this.props.music.length - 1].id[0])}
        <form onSubmit={this.addNewRecommendation}>
          <Select
            style={{
              backgroundColor: "white",
            }}
            variant="outlined"
            required
            name="rate"
            //sets value of input to value of local state
            value={this.state.rate}
            onChange={(event) => this.handleChange(event, "rate")} //sends input values to local state
          >
            {/* select items 1 - 5 */}
            <MenuItem value="5"><Rating value={5} readOnly size="small" /></MenuItem>
            <MenuItem value="4"><Rating value={4} readOnly size="small" /></MenuItem>
            <MenuItem value="3"><Rating value={3} readOnly size="small" /></MenuItem>
            <MenuItem value="2"><Rating value={2} readOnly size="small" /></MenuItem>
            <MenuItem value="1"><Rating value={1} readOnly size="small" /></MenuItem>
          </Select>
          <Button
            variant="contained"
            color="secondary"
            type="submit"
          >
            Add recommendation
            </Button>
        </form>
        <div>
          <img
            src={this.state.randomSong.image}
            alt="album art"
            style={{ width: 100 }}
          />
        </div>
        {/* takes open log, places it in href, can open random song in spotify */}
        <a href={this.state.randomSong.open} target="_blank">
          <button>Open this song in spotify</button>
        </a>
        {/* gives a list of artists that are similar to randomly generated one. */}
        <ul>
          Similar Artists:
          {artists.map((artist, index) => {
            return <li key={index}>{artist}</li>;
          })}
        </ul>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  errors: state.errors,
  music: state.music,
  user: state.user,
});
export default connect(mapStateToProps)(RandomSong);
