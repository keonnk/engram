import autolinker from 'autolinker';

import {
  getRoom,
  getRoomMessages,
  MessageType,
  onRoomMessage,
  sendRoomMessage,
  deleteRoomMessage,
  onDeleteMessage,
} from '../apis/RoomApi';

import { getSelf, getUser } from '../apis/UserApi';
import { Button } from '../components/Button';
import { Div } from '../components/Div';
import { Span } from '../components/Span';
import { Input } from '../components/Input';
import { Routes } from '../routes/Routes';
import { Borders } from '../theme/Borders';
import {
  onClick,
  onMouseLeave,
  onMouseEnter,
  setStyle,
  setText,
} from '../utils/DomUtils';
import { setURL } from '../utils/HistoryUtils';

function getOptionsButton(element: Element): HTMLSpanElement {
  return element.querySelector('div:nth-child(2) > div > span');
}

type RoomViewProps = {
  roomId: string;
};

export function RoomView(props: RoomViewProps) {
  let messages: MessageType[] = [];
  let userRoomConfig: {
    lastReadMessageId: string;
  } = null;

  const roomView = Div();

  setStyle(roomView, {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 50px)',
    flexGrow: '1',
  });

  const room = getRoom(props.roomId);

  onRoomMessage(props.roomId, (message) => {
    if (isLastMessageToday(messages[1], message)) {
      messageList.prepend(DateDivider(message.createdAt));
    }
    const newMessage = Message(message);
    messageList.prepend(newMessage);
  });
  onDeleteMessage(props.roomId, (messageId) => {
    const messageToDelete = document.getElementById(messageId);
    messageToDelete.remove();
  });

  function Message(props: MessageType) {
    const el = Div({
      class: 'message',
      id: props._id,
    });

    setStyle(el, {
      display: 'flex',
      margin: '4px 0px',
    });

    onMouseEnter(el, () => {
      el.style.backgroundColor = '#f2f2f2';
      getOptionsButton(el.lastElementChild).style.display = 'block';
    });

    onMouseLeave(el, () => {
      el.style.backgroundColor = '';
      getOptionsButton(el.lastElementChild).style.display = 'none';
    });

    const user = getUser(props.user);

    const userIcon = Div();
    setStyle(userIcon, {
      display: 'flex',
      flexShrink: '0',
      justifyContent: 'center',
      alignItems: 'center',
      fontWeight: 'bold',
      borderRadius: '999px',
      height: '30px',
      width: '30px',
      backgroundColor: user.color || 'black',
      color: 'white',
      textAlign: 'center',
      lineHeight: '30px',
      marginRight: '10px',
      fontSize: '12px',
    });

    const firstInitial = user.name.charAt(0);
    const lastInitial = user.name.split(' ')[1].charAt(0);

    userIcon.innerText = firstInitial + lastInitial;
    el.append(userIcon);

    const messageContentEl = Div();
    setStyle(messageContentEl, {
      width: '100%',
    });
    el.append(messageContentEl);

    async function init() {
      const userNameEl = Span();
      setStyle(userNameEl, {
        fontWeight: 'bold',
      });

      setText(userNameEl, user.name);
      messageContentEl.append(userNameEl);

      const messageTime = Span();
      setStyle(messageTime, {
        marginLeft: '8px',
        fontSize: '12px',
      });

      const messageCreatedAt = new Date(props.createdAt).toLocaleTimeString(
        'en',
        { hour: 'numeric', minute: '2-digit' }
      );

      messageTime.innerHTML = messageCreatedAt;
      messageContentEl.append(messageTime);

      const bodyEl = Div();
      setStyle(bodyEl, {
        position: 'relative',
      });

      bodyEl.innerHTML = autolinker.link(props.body);

      const currentUser = getSelf();
      if (props.user === currentUser._id) {
        const messageOptions = Span({
          class: 'message-options',
        });
        setStyle(messageOptions, {
          position: 'absolute',
          top: '-20px',
          right: '12px',
          display: 'none',
          cursor: 'pointer',
          width: '24px',
          height: '20px',
          textAlign: 'center',
          fontSize: '14px',
          background: '#f7f7f7',
          color: '#333',
          borderRadius: '2px',
        });

        messageOptions.innerHTML = 'del';
        bodyEl.append(messageOptions);

        onClick(messageOptions, () => {
          handleDeleteMessage(props._id);
        });
      }
      messageContentEl.append(bodyEl);
    }

    init();

    return el;
  }

  function MessageList() {
    const el = Div({
      class: 'message-list',
    });

    setStyle(el, {
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column-reverse',
    });

    async function init() {
      const messagesList = await getRoomMessages(props.roomId);
      messages = messagesList.messages;
      userRoomConfig = messagesList.userRoomConfig;

      for (let i = 0; i < messages.length; i++) {
        if (messages[i]._id === userRoomConfig.lastReadMessageId) {
          el.append(NewRow());
        }
        el.appendChild(Message(messages[i]));

        const message = new Date(messages[i].createdAt).toLocaleDateString();
        const nextMessage = messages[i + 1]
          ? new Date(messages[i + 1].createdAt).toLocaleDateString()
          : null;

        if (message !== nextMessage) {
          el.append(DateDivider(messages[i].createdAt));
        }
      }
    }

    init();

    return el;
  }

  function NewRow() {
    const el = Div();
    setStyle(el, {
      borderBottom: '1px solid red',
    });
    return el;
  }

  function DateDivider(dividerDate: Date) {
    const messagesDate = Div({
      class: 'date-divider',
    });
    setStyle(messagesDate, {
      display: 'flex',
      position: 'relative',
    });

    const dateBox = Div();
    setStyle(dateBox, {
      background: '#fff',
      marginLeft: 'auto',
      marginRight: 'auto',
      padding: '8px',
      fontSize: '12px',
      zIndex: '1',
    });

    dateBox.innerHTML = new Date(dividerDate).toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    messagesDate.append(dateBox);

    const messagesDateHr = Div();
    setStyle(messagesDateHr, {
      position: 'absolute',
      bottom: '50%',
      width: '100%',
      border: 'none',
      borderTop: '1px solid #ddd',
      opacity: '0.5',
      boxSizing: 'border-box',
    });

    messagesDate.append(messagesDateHr);
    return messagesDate;
  }

  function isLastMessageToday(
    lastListMessage: MessageType,
    currentMessage: MessageType
  ) {
    if (!lastListMessage) {
      return true;
    }

    const dateLastListMessage = new Date(
      lastListMessage.createdAt
    ).toLocaleDateString();
    const dateCurrentMessage = new Date(
      currentMessage.createdAt
    ).toLocaleDateString();

    return dateLastListMessage !== dateCurrentMessage;
  }

  function TextBox(props: { onSubmit: (text: string) => void }) {
    const el = Div({
      class: 'textbox',
    });
    setStyle(el, {
      flexShrink: '0',
    });

    const input = Input();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        props.onSubmit(input.value);
        input.value = '';
      }
    });

    el.appendChild(input);

    setTimeout(() => {
      input.focus();
    }, 0);

    return el;
  }

  function RoomHeader() {
    const el = Div();

    setStyle(el, {
      display: 'flex',
      borderBottom: Borders.bottom,
      padding: '8px',
      width: '100%',
      maxWidth: '900px',
      margin: '0 auto',
    });

    const btnBack = Button({
      text: '<',
    });
    el.append(btnBack);
    onClick(btnBack, () => {
      setURL(Routes.home);
    });

    const roomNameEl = Div();
    setStyle(roomNameEl, {
      paddingLeft: '8px',
    });
    setText(roomNameEl, room.name);

    el.append(roomNameEl);

    return el;
  }

  const roomHeader = RoomHeader();
  roomView.append(roomHeader);

  const messageList = MessageList();

  function handleSubmit(text: string) {
    sendRoomMessage({
      room: props.roomId,
      body: text,
    });
  }

  function handleDeleteMessage(id: string) {
    deleteRoomMessage({
      room: props.roomId,
      id: id,
    });
  }

  const textBox = TextBox({ onSubmit: handleSubmit });

  roomView.appendChild(messageList);
  roomView.appendChild(textBox);

  return roomView;
}
