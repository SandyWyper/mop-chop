function checkStatus(response) {
    if (response.status === 200) {
        return Promise.resolve(response);
    } else {
        return Promise.reject(
            new Error(response.statusText));
    }
}

export {checkStatus};