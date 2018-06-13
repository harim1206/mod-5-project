import React, { Component } from 'react';
import Video from './Video.js'
import Library from './Library.js'
import PlaylistContainer from '../container/PlaylistContainer.js'

class App extends Component {
  state={
    pagination: {},
    releases: [],
    shuffledReleases: [],
    currentRelease: {},
    nextRelease:{},
    currentReleaseURL: "",
    newPlaylistInput: "",
    playlists: []
  }

  // takes in raw fetch json data and returns clean data for state
  parseJSONtoData = (releases) => {
    return releases.map((release)=>{
      let data = release.basic_information
      return(
        {
          id: releases.indexOf(release),
          artist : data.artists[0].name,
          title : data.title,
          label : data.labels[0].name,
          catno : data.labels[0].catno,
          resource_url: data.resource_url
        }
      )
    })
  }

  componentDidMount(){
    const collectionUrl = 'https://api.discogs.com/users/harim1206/collection/folders/0/releases?per_page=200&page=1&f=json'

    fetch(collectionUrl, {mode: 'cors'})
    .then(res => res.json())
    .then(data => {
      let shuffledReleases = this.shuffleArr(data.releases).slice(0,50)
      const parsedData = this.parseJSONtoData(shuffledReleases)

      this.setState({
        pagination: data.pagination,
        releases: data.releases,
        shuffledReleases: parsedData,
        currentRelease: parsedData[0],
        nextRelease: parsedData[1]
      } , ()=>{
        console.log(`this.state:`, this.state)
        this.fetchReleaseURL(this.state.currentRelease)
      })
    })

    const playlistUrl = '//localhost:3000/api/v1/playlists'
    fetch(playlistUrl)
    .then(res => res.json())
    .then(data => {

      const playlists = data.data.map((obj)=>{
        return {id: obj.id, name: obj.attributes.name}
      })

      this.setState({
        playlists: playlists
      },()=>console.log(`this.state.playlists after playlist fetch`, this.state.playlists))
    })

  }

  // returns a shuffled array
  shuffleArr = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Play video on click of the release
  onClick = (release, id) => {
    this.setState({
      currentRelease: release,
      nextRelease: this.state.shuffledReleases[id+1]
    },()=>console.log(`state onClick: `,this.state))

    this.fetchReleaseURL(release)
  }

  // on table column header sort
  onSort = (sortKey) =>{
    let data = this.state.shuffledReleases

    sortKey === 'id' ? data.sort((a,b) => a[sortKey] - b[sortKey]) : data.sort((a,b) => a[sortKey].localeCompare(b[sortKey]))

    this.setState({shuffledReleases: data})

  }

  // play next video once it finishes
  onEnded = () =>{
    const nextReleaseId = this.state.shuffledReleases.indexOf(this.state.nextRelease)

    this.setState({
      currentRelease: this.state.nextRelease,
      nextRelease: this.state.shuffledReleases[nextReleaseId+1]

    }, ()=>{
      this.fetchReleaseURL(this.state.currentRelease)
    })


  }

  fetchReleaseURL = (release) => {

    fetch(release.resource_url)
    .then(res=>res.json())
    .then(data=>{

      let randomVideo = {uri:""}
      if(data.videos){
        randomVideo = data.videos[Math.floor(Math.random()*data.videos.length)]
      }

      this.setState({
          currentReleaseURL: randomVideo.uri
        },()=>{
          // console.log(`this.state after URL fetch, `,this.state)
      })

    })

  }

  // on new playlist submit
  onNewPlaylistSubmit = (e) =>{
    e.preventDefault()

    let postData = {
      name: this.state.newPlaylistInput
    }
    // debugger

    fetch('http://localhost:3000/api/v1/playlists', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    })
    .then(res =>res.json())
    .then(data =>{
      this.setState({
        playlist: this.state.playlists.push(this.state.newPlaylistInput)
      })
    })


  }

  // new playlist input change
  onNewPlaylistInputchange = (e) =>{
    this.setState({
      newPlaylistInput: e.target.value
    })

  }

  onPlaylistclick = () =>{
    debugger
  }

  // on playlist select menu change, add track to playlist
  onReleasePlaylistChange = (release, event) =>{

    let postData = {
      playlist_id: event.target.value,
      resource_url: release.resource_url
    }



    fetch('http://localhost:3000/api/v1/releases', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    })
    .then(res =>res.json())
    .then(data =>{

      debugger

    })
  }

  render() {
    return (
      <div className="App">
        <Video
          onClick={this.onClick}
          onEnded={this.onEnded}
          currentReleaseURL={this.state.currentReleaseURL}
        />
        <div className="main-container">
          <PlaylistContainer
            onNewPlaylistSubmit = {this.onNewPlaylistSubmit}
            onNewPlaylistInputchange = {this.onNewPlaylistInputchange}
            onPlaylistClick = {this.onPlaylistClick}
            newPlaylistInput = {this.state.newPlaylistInput}
            playlists = {this.state.playlists}
          />
          <Library
            shuffledReleases={this.state.shuffledReleases}
            playlists={this.state.playlists}
            onClick={this.onClick}
            onSort={this.onSort}
            onReleasePlaylistChange={this.onReleasePlaylistChange}
          />
        </div>
      </div>
    );
  }
}


export default App;
