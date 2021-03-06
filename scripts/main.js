'use strict';

/*!
 *
 *  Web Starter Kit
 *  Copyright 2014 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

var API_KEY = 'AIzaSyCNN_nP2Qc1ApEgtrdyQqSKUVLSsyBjyXE';
var PUSH_SERVER_URL = 'http://localhost/simplePushDemo/';

function onPushSubscription(pushSubscription) {
  // Here we would normally send the endpoint
  // and subscription ID to our server.
  // In this demo we just use send these values to
  // our server via XHR which sends a push message.
  // window.PushDemo.ui.showGCMPushOptions(true);
  // window.PushDemo.ui.setPushSwitchDisabled(false);

  var pushEndPoint = pushSubscription.endpoint;
  var subscriptionId = pushSubscription.subscriptionId;

  // Code to handle the XHR
  var sendPushViaXHRButton = document.querySelector('.js-xhr-button');
  sendPushViaXHRButton.addEventListener('click', function(e) {
    var formData = new FormData();
    formData.append('subscriptionId', subscriptionId);
    formData.append('endpoint', pushEndPoint);

    fetch(PUSH_SERVER_URL + 'send_push', {
        method: 'post',
        body: formData
      }).then(function(response) {
        console.log('Response = ', response);
      }).catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
  });

  // The curl command to trigger a push message straight from GCM
  var curlCommand = 'curl --header "Authorization: key=' + API_KEY +
      '" --header Content-Type:"application/json" ' + pushEndPoint + 
      ' -d "{\\"registration_ids\\":[\\"' + subscriptionId + '\\"]}"';

  var curlCodeElement = document.querySelector('.js-curl-code');
  curlCodeElement.innerHTML = curlCommand;
}

function subscribeDevice() {
  // Disable the switch so it can't be changed while
  // we process permissions
  // window.PushDemo.ui.setPushSwitchDisabled(true);

  // We need the service worker registration to access the push manager
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.subscribe()
      .then(onPushSubscription)
      .catch(function(e) {
        if (Notification.permission === 'denied') {
          console.log('Ooops Notifications are Blocked', 
            'Unfortunately you just permanently blocked notifications. Please unblock / ' +
            'allow them to switch on push notifications.');
          // window.PushDemo.ui.setPushSwitchDisabled(true);
        } else {
          console.log('Ooops Push Couldn\'t Register', 
            '<p>When we tried to ' +
            'get the subscription ID for GCM, something went wrong, not ' +
            'sure why.</p>' +
            '<p>Have you defined "gcm_sender_id" and ' +
            '"gcm_user_visible_only" in the manifest?</p>' +
            '<p>Error message: ' +
            e.message +
            '</p>');
          // window.PushDemo.ui.setPushSwitchDisabled(false);
        }
        // window.PushDemo.ui.setPushChecked(false);
      });
  });
}

function unsubscribeDevice() {
  // Disable the switch so it can't be changed while
  // we process permissions
  window.PushDemo.ui.setPushSwitchDisabled(true);

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.getSubscription().then(
      function(pushSubscription) {
        // Check we have everything we need to unsubscribe
        if (!pushSubscription) {
          // Disable the switch so it can't be changed while
          // we process permissions
          window.PushDemo.ui.setPushSwitchDisabled(false);

          // Set the state of the push switch
          window.PushDemo.ui.setPushChecked(false);

          window.PushDemo.ui.showGCMPushOptions(false);
          return;
        }
         
        // TODO: Remove the device details from the server
        // i.e. the pushSubscription.subscriptionId and 
        // pushSubscription.endpoint

        pushSubscription.unsubscribe().then(function(successful) {
          console.log('Unsubscribed from push: ', successful);
          if (!successful) {
            // The unsubscribe was unsuccessful, but we can
            // remove the subscriptionId from our server
            // and notifications will stop
            // This just may be in a bad state when the user returns
            console.error('We were unable to unregister from push');
          }

          window.PushDemo.ui.setPushSwitchDisabled(false);
          window.PushDemo.ui.showGCMPushOptions(false);
        }).catch(function(e) {
          console.log('Unsubscribtion error: ', e);
          window.PushDemo.ui.setPushSwitchDisabled(false);
          window.PushDemo.ui.showGCMPushOptions(true);

          // Set the state of the push switch
          window.PushDemo.ui.setPushChecked(true);
        });
      }.bind(this)).catch(function(e) {
        console.error('Error thrown while revoking push notifications. ' +
          'Most likely because push was never registered', e);
      });
  });
}

// Once the service worker is registered set the initial state
function initialiseState() {
  // Make sure we can show notifications
  if (!('Notification' in window)) {
    console.log('Ooops Notifications Not Supported', 
      'This is most likely ' +
      'down to the experimental web features not being enabled in ' +
      'chrome://flags. ' +
      'Showing a notification is required when you receive a push message in Chrome.' +
      'Checkout chrome://flags/#enable-experimental-web-platform-features');
    return;
  }
  // Are Notifications supported in the service worker?
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.log('Ooops Notifications Not Supported',
      'This is most likely ' +
      'down to the experimental web features not being enabled in ' +
      'chrome://flags or you\'re using a version of Chrome older than version 42.' +
      'Showing a notification is required when you receive a push message in Chrome.' +
      'Checkout chrome://flags/#enable-experimental-web-platform-features');
    return;
  }

  // If the notification permission is denied, it's a permanent block
  if (Notification.permission === 'denied') {
    console.log('Ooops Notifications are Blocked', 
      'Unfortunately notifications are permanently blocked. Please unblock / ' +
      'allow them to switch on push notifications.');
    return;
  }

  // Check if push messaging is supported
  if (!('PushManager' in window)) {
    console.log('Ooops Push Isn\'t Supported',
      '<p>This could be a few things.</p>' +
      '<ol>' +
      '<li>Make sure you are using Chrome Canary / Chrome version 42+</li>' +
      '<li>Make sure you have Experimental Web Platform features enabled ' +
      'in Chrome flags (chrome://flags/#enable-experimental-web-platform-features)</li>' +
      '<li>Make sure you have "gcm_sender_id" and "gcm_user_visible_only" defined' +
      ' in your manifest</li>' +
      '</ol>' +
      'If both of the above are true, then please message ' +
      '<a href="https://twitter.com/gauntface">@gauntface</a> as the ' +
      'demo is probably broken.');
    return;
  }

  // Check if push is supported and what the current state is
  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    console.log('serviceWorkerRegistration');
    // Let's see if we have a subscription already
    serviceWorkerRegistration.pushManager.getSubscription()
      .then(function(subscription) {
        // window.PushDemo.ui.setPushSwitchDisabled(false);
        if (!subscription) {
          // NOOP
          return;
        }

        // Set the initial state of the push switch
        // window.PushDemo.ui.setPushChecked(true);
        app.enablePushSwitch.checked = true;
        // Update the current state with the
        // subscriptionid and endpoint
        onPushSubscription(subscription);
      })
      .catch(function(e) {
        // window.PushDemo.ui.setPushSwitchDisabled(false);
        app.enablePushSwitch.checked = false;
      });
  });
}

window.addEventListener('UIReady', function() {
  // When the toggle switch changes, enabled / disable push
  // messaging
  window.app ={};
  app.enablePushSwitch = document.querySelector('.js-enable-push');
  app.enablePushSwitch.addEventListener('change', function(e) {
    if (e.target.checked) {
      subscribeDevice();
    } else {
      unsubscribeDevice();
    }
  });

  // Check that service workers are supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/simplePushDemo/service-worker.js', {
      scope: './'
    })
    .then(initialiseState);
  } else {
    // Service Workers aren't supported so you should hide the push UI
    // If it's currently visible.
    console.log('Ooops Service Workers aren\'t Supported',
      'Service Workers aren\'t supported in this browser. ' +
      'For this demo be sure to use ' +
      '<a href="https://www.google.co.uk/chrome/browser/canary.html">Chrome Canary</a>' +
      ' or version 42.');
    // window.PushDemo.ui.showOnlyError();
  }
});
