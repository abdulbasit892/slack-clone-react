import React, { useState, useEffect, isValidElement } from 'react'
import { Segment, Comment } from 'semantic-ui-react'

import MessagesHeader from './MessagesHeader'
import MessagesForm from './MessagesForm'
import Message from './Message'

import firebase from '../../firebase'

export default function Messages({ currentUser, currentChannel }) {
  const [user] = useState(currentUser)
  const [channel] = useState(currentChannel)
  const [messagesRef] = useState(firebase.database().ref('/messages'))
  const [messages, setMessages] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchingMessages, setSearchingMessages] = useState(false)
  const [searchResults, setSearchResults] = useState([])

  useEffect(() => {
    if (user && channel) {
      addListeners(channel)
    }
    return () => {
      removeAllListeners()
    }
  }, [])

  const addListeners = channel => {
    channelListener(channel.id)
  }

  /**
   *
   * @param {string} channelId
   * Change listener to the channel, triggers whenever the message is added
   */
  const channelListener = channelId => {
    messagesRef.child(channelId).on('child_added', snap => {
      const message = snap.val()
      setMessages(messages => [...messages, message])
    })
  }

  const removeAllListeners = () => {}

  /**
   *
   * @param {object} channel
   * returns the channel name
   */
  const getChannelName = channel => (channel ? `#${channel.name}` : '')

  /**
   *
   * @param {Array} messages
   * @description Get the total count and generate a readable string
   * @return {string} - {userCount} user{plural ? s : _ }
   */
  const getUniqueUsers = messages => {
    const uniqueUsers = messages.reduce((acc, message) => {
      if (!acc.includes(message.user.name)) {
        acc.push(message.user.name)
      }
      return acc
    }, [])

    const numUniqueUsers = uniqueUsers.length
    const areUserPlurals = numUniqueUsers > 1 || numUniqueUsers === 0
    return `${numUniqueUsers} user${areUserPlurals && 's'}`
  }

  /**
   *
   * @param {Event} event
   * handles the event change for search field in message header
   */
  const handleSearchMessages = event => {
    setSearchTerm(event.target.value)
    setSearchingMessages(true)
  }

  /**
   * Search effect handler
   * When the search term is changed, we are filtering out the messages
   */
  useEffect(() => {
    const regex = new RegExp(searchTerm, 'gi')
    const results = messages.reduce((acc, message) => {
      if (
        (message.content && message.content.match(regex)) ||
        message.user.name.match(regex)
      ) {
        acc.push(message)
      }
      return acc
    }, [])
    setSearchResults(results)
    //setting the search indicator after one second
    setTimeout(() => setSearchingMessages(false), 800)
  }, [searchTerm])

  /**
   *
   * @param {Array} messages
   * renders the messages
   */
  const renderMessages = messages => {
    return (
      messages.length > 0 &&
      messages.map(message => (
        <Message key={message.timestamp} message={message} user={user} />
      ))
    )
  }

  return (
    <>
      <MessagesHeader
        channelName={getChannelName(channel)}
        users={getUniqueUsers(messages)}
        searchTerm={searchTerm}
        handleSearchMessages={handleSearchMessages}
        searching={searchingMessages}
      />

      <Segment className="messages">
        <Comment.Group>
          {searchTerm
            ? renderMessages(searchResults)
            : renderMessages(messages)}
        </Comment.Group>
      </Segment>

      <MessagesForm
        currentChannel={currentChannel}
        currentUser={currentUser}
        messagesRef={messagesRef}
      />
    </>
  )
}
