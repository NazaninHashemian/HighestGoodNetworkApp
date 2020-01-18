const APIEndpoint = process.env.REACT_APP_APIENDPOINT

export const ENDPOINTS = {
	USER_PROFILE: userId => `${APIEndpoint}/userprofile/${userId}`,
	USER_TEAM: userId => `${APIEndpoint}/userprofile/teammembers/${userId}`
}
