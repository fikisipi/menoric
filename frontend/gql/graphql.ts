/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Message = {
  __typename?: 'Message';
  id: Scalars['ID'];
  likes: Array<User>;
  message: Scalars['String'];
  time: Scalars['String'];
  user: User;
};

export type Mutation = {
  __typename?: 'Mutation';
  follow: Scalars['String'];
  login: Token;
  loginToken: Token;
  newMessage: Message;
  setBio: Scalars['String'];
  signup: Token;
  unfollow: Scalars['String'];
};


export type MutationFollowArgs = {
  to: Scalars['ID'];
  token: Scalars['String'];
};


export type MutationLoginArgs = {
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationLoginTokenArgs = {
  token: Scalars['String'];
};


export type MutationNewMessageArgs = {
  message: Scalars['String'];
  token: Scalars['String'];
};


export type MutationSetBioArgs = {
  bio: Scalars['String'];
  token: Scalars['String'];
};


export type MutationSignupArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
  username: Scalars['String'];
};


export type MutationUnfollowArgs = {
  to: Scalars['ID'];
  token: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  getTimeline?: Maybe<Array<Message>>;
  getUser?: Maybe<User>;
  topMessages?: Maybe<Array<Message>>;
};


export type QueryGetTimelineArgs = {
  userId: Scalars['ID'];
};


export type QueryGetUserArgs = {
  username: Scalars['String'];
};

export type Token = {
  __typename?: 'Token';
  token: Scalars['String'];
  user: User;
};

export type User = {
  __typename?: 'User';
  bio: Scalars['String'];
  followers?: Maybe<Array<User>>;
  following?: Maybe<Array<User>>;
  id: Scalars['ID'];
  messages?: Maybe<Array<Message>>;
  username: Scalars['String'];
};

export type _Service = {
  __typename?: '_Service';
  sdl: Scalars['String'];
};
