// See https://github.com/dialogflow/dialogflow-fulfillment-nodejs
// for Dialogflow fulfillment library docs, samples, and to report issues
'use strict';

const axios = require("axios");

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
 
process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements
 
exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
 
  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }
 
  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }
  
  // -----------------------------------------
  // ----------- Custom Intents --------------
  
  // API-Ninjas Exercises Info
  const options = {
    method: 'GET',
    url: 'https://exercises-by-api-ninjas.p.rapidapi.com/v1/exercises',
    params: {name: '', type: '', muscle: '', difficulty: '', offset: 0},
    headers: {
      'X-RapidAPI-Key': '169e53ce5cmsh0acd1fb675f4788p1f97ddjsnd0ef5d209628',
      'X-RapidAPI-Host': 'exercises-by-api-ninjas.p.rapidapi.com'
    }
  };

  const freqToNumWorkouts = (days, chunk) => {
    let multiplier;
    
    console.log('***** chunk: ', chunk);
    if (chunk.unit === 'wk') {
      multiplier = 4/chunk.amount;
    }
    else if (chunk.unit === 'mo') {
      multiplier = 1/chunk.amount;
    }
    // prevent overtraining handled in main fxn
    else if (chunk.unit === 'day') {
      multiplier = (4*7)/chunk.amount;
    }
    // anything else is out of bounds
    else {
      multiplier = -1;
    }
    console.log(multiplier);
    return Math.ceil(days * multiplier);
  };
  
  const toMins = time => {
    if (time.unit === 'min') return time.amount;
    else if (time.unit === 'h') return time.amount * 60;
    else if (time.unit === 's') return 0;
    else return 200;
  };
  
  function plan(agent) {
    const lvl = agent.parameters.difficulty;       // op
    const days = agent.parameters.days;            // req
    const chunk = agent.parameters['time-chunk'];  // req
    const goal = agent.parameters.goal;            // op
    const split = agent.parameters.split;          // op
    let time = agent.parameters['workout-len'];    // op
    
    let output = '';  // to add to agent and respond
    
    let num_workouts = freqToNumWorkouts(days,chunk);
    console.log('******** num_workouts: ', num_workouts);
    if (num_workouts <= 0) {
      output += 'Please note that isn\'t a high enough frequency for a good workout plan. \n\n';
    }
    // warn if more than 6x/week
    else if (num_workouts > 24) {
      output += 'Please note that it is recommended to take at least one day off per week to avoid injury from overuse. Listen to' +
        ' your body and skip a day if you need more time to recover.\n\n';
    }
    else {
      output += 'That workout frequency seems average. Remember to always take a day off if you don\'t feel you have recovered ' +
        'from your previous workout.\n\n';
    }
    
    if (time) {
      time  = toMins(time);
      if (time <= 30) {
        output += 'The amount of time you want to set aside for workouts is short. To keep workouts short, it may be good ' +
          'to focus on high-intensity work by increasing exercise difficulty and shortening your resting periods.\n\n';
      }
      else if (time >= 90) {
        output += 'Working out for that long means you have more time for rest in between sets. The hard part will be staying focused ' +
          'and making sure that the workout isn\'t too easy. Try stretching between sets to stay on task.\n\n';
      }
      else {
        output += 'That is an average length workout and very flexible. Feel free to try any and every style of exercise, which is ' +
          'not only good for overall fitness, but will keep things interesting.\n\n';
      }
    }
    
    if (lvl) {
      output += 'Remember that you can scale any workout\'s level by making adjustments. If it\'s a weightlifiting workout, you can ' +
        'use lighter or heavier weights. If it\'s a cardio workout, you can adjust the work times. If it\'s a calisthenics workout, ' +
        'you can find easier or harder variations of an exercises. No matter what, changing the amount of rest time will greatly affect ' +
        'the difficulty of the workout.\n\n';
    }
    
    if (goal) {
      if (goal === 'hypertrophy') {
        output += 'To increase muscle hypertrophy you want to increase time under tention, or how long a muscle is being worked. ' +
          'Aim for rep ranges around 7-14, and do slower reps with a manageable weight in a full range of motion, and ' +
          'try to workout 3 - 5 days a week. It will also be very important to get enough protein, approximately 1.5g per kg of body ' +
          'weight.\n\n';
      }
      else if (goal === 'strength') {
        output += 'To get stronger, the most important thing is to lift heavy. For weight lifting, aim for 3-8 reps at a high percentage ' +
          'of your one rep max with long rests in between. For calisthenics, once you are able to confidently do 10 reps of an exercise, ' +
          'start working on a harder variation, even if you can only get one rep.\n\n';
      }
      else if (goal === 'fitness') {
        output += 'Workout out for general fitness offers the most flexibility in training style. Incorperate strength training, ' +
          'hypertrophy-based training, cardio, and mobility. Find activities that you enjoy doing, and vary your workouts as much ' +
          'as possible. It can be helpful to find a more specific goal (a certain mile time, a particular one rep max for an exercise, ' +
          'etc.) to find somewhere to start.\n\n';
      }
      else if (goal === 'flexibility') {
        output += 'The way to get more flexible is simply to stretch. For the best results, aim for 2-5 minutes over the course of the ' +
          'week per muscle, split up into 30 second sets. Keep in mind that static stretching will only affect range of motion. ' +
          'In order to improve mobility (or strength through a full range of motion) work on dynamic stretches and weight lifting.\n\n';
      }
      else if (goal === 'aesthetics') {
        output += 'Aesthetics have more to do with diet than with training methodology. In order to be lean, you have to eat in a ' +
          'calorie defecit. Most body builders work on a bulk/cut cycle where they eat in a calorie surplus and do lots of weight ' +
          'in order to put on muscle, and then switch to eating in a deficit to lose fat that they put on while bulking. Keep in mind' +
          'that this cycle is very restrictive, and being very lean (like having a 6-pack) can be unhealthy and a very difficult to ' +
          'sustain for any significant period of time.\n\n';
      }
      else {
        // shouldn't happen
      }
    }
    
    agent.add(output);
  }
  
  const splitToMuscle = split => {
    let muscles = [];
    if (split === 'push') {
      muscles.push('chest', 'shoulders', 'triceps');
    }
    else if (split === 'pull') {
      muscles.push('middle_back', 'biceps', 'forearms');
    }
    else if (split === 'legs') {
      muscles.push('glutes', 'quadriceps', 'hamstrings', 'calves');
    }
    else if (split === 'upper') {
      muscles.push('neck', 'shoulders', 'chest', 'triceps', 'biceps', 'abdominals');
    }
    else if (split === 'full') {
      muscles.push('chest', 'shoulders', 'middle_back', 'abdominals', 'qudriceps', 'glutes');
    }
    else if (split === 'cardio') {
      // skip
    }
    else if (split === 'flexibility') {
      // skip
    }
    else if (split === 'arms') {
      muscles.push('shoulders', 'triceps', 'biceps', 'forearms');
    }
    
    return muscles;
  };
  
  const randint = num => {
    return Math.floor(Math.random() * num);
  };
  
  function single(agent) {
    const lvl = agent.parameters.difficulty;
    let time = agent.parameters.time;
    const muscle = agent.parameters.muscle;
    let split = agent.parameters.split;
    const gear = agent.parameters.equipment;
    
    let output = '';
    let muscles = [];
    let cardioStretch = false;
    let num_calls = 0;
    
    if (!time) {
      output += 'Since you didn\'t tell me how long you have, I will create a 45 minute workout. \n';
      time = 45;
    }
    else {
      time = toMins(time);
    }
    if (muscle.length > 0) {
      num_calls += muscle.length;
      muscles = muscle;
    }
    // if no specifics then do a full body workout
    else if (!split) {
      split = 'full';
    }
    if (split) {
      if (split === 'cardio' || split === 'flexibility') {
        cardioStretch = true;
      }
      muscles = splitToMuscle(split);
      num_calls += muscles.length;
    }
    if (lvl) {
      options.params.difficulty = lvl;
    }
    // only paying attention to first piece of equiptment for ease 
    if (gear.length > 0) {
      options.params.name = gear[0];
    }
    
    let calls = [];
    for (let i = 0; i < num_calls; ++i) {
      options.params.muscle = muscles[i];
      calls.push(axios.request(options));
      options.params.muscle = '';
    }
    if (cardioStretch) {
      options.params.type = split;
      for (let i = 0; i < 4; ++i) {
        options.params.offset = i + randint(25);
        calls.push(axios.request(options));
      }
    }
    // warmup call
    options.params.type = 'cardio';
    options.params.offset = randint(20);
    calls.push(axios.request(options));
    //cooldown call
    options.params.offset = randint(20);
    options.params.type = 'stretching';
    calls.push(axios.request(options));
    
    return axios.all(calls).then(responses => {
      // responses is an array, access data with responses[i].data
      const outline = {
        warmup: [],
        main: [],
        cooldown: []
      };
      // sort responses
      for (let i = 0; i < responses.length; ++i) {
        if (responses[i].data.length > 0) {
          if (outline.warmup.length < 1 && responses[i].data[0].type === 'cardio') {
            outline.warmup = responses[i].data;
          }
          else if (outline.cooldown.length < 1 && responses[i].data[0].type === 'stretching') {
            outline.cooldown = responses[i].data;
          }
          else {
            outline.main = outline.main.concat(responses[i].data.filter((item) => outline.main.indexOf(item) < 0));
          }
        }
      }

      // cardio warmup
      output += '10-15 minute Warmup: \n';
      for (let i = 0; i < 2; ++i) {
        output += `${i+1}: ${outline.warmup[randint(outline.warmup.length - 1)].name}\n`;
      }
      output += '\n';
      // main workout - time v. exercises not exact
      output += `${time-30}-${time-20} minute Workout: \n`;
      let max = Math.ceil((time - 20) / 10);
      for (let i = 0; i < max; ++i) {
        output += `${i+1}: ${outline.main[randint(outline.main.length-1)].name}\n`;
      }
      output += '\n';
      // stretching cooldown
      output += '10-15 minute Cooldown: \n';
      for (let i = 0; i < 4; ++i) {
        output += `${i+1}: ${outline.cooldown[randint(outline.cooldown.length - 1)].name}\n`;
      }
      
      agent.add(output);
    }).catch((error, response, body) => {
      if(error) console.error('Request failed:', error);
      else if(response.statusCode != 200) console.error('**** Error:', response.statusCode, body.toString('utf8'));
      else console.log(body);
      
      agent.add(`Sorry! There was an error gathering exercises.`);
    });
  }
  
  function howto(agent) {
    const name = agent.parameters.exercise;
    options.params.name = name;
    return axios.request(options).then(function (response) {
      const list = response.data;
      let i = 0;
      for (; i < list.length; ++i) {
        if (list[i].instructions)
          break;
      }
      agent.add(list[i].instructions);
    }).catch(function (error) {
      agent.add(`Sorry! There was an errror looking through the exercises.`);
      console.error(error);
    });
  }
  
  function target(agent) {
    const muscle = agent.parameters.muscle;
    const split = agent.parameters.split;
    
    if (muscle) {
      options.params.offset = randint(50);   // don't give the same thing all the time
      options.params.muscle = muscle.replace(' ', '_');
      return axios.request(options).then(function (response) {
        
        if (response.data.length > 0) {
          let output = 'Some exercises that target that muscle are: \n';

          for(let i = 0; i < response.data.length; ++i) {
            output += `${i+1}. ${response.data[i].name}\n`;
          }
          agent.add(output);
        }
        else {
          agent.add(`Sorry! I don't know any good exercises for that muscle.`);
        }
      }).catch(function (error) {
        agent.add(`Sorry! There was an errror looking through the exercises.`);
        console.error(error);
      });
    }
  }
  
  // -------------- End Custom ---------------
  // -----------------------------------------

  // // Uncomment and edit to make your own intent handler
  // // uncomment `intentMap.set('your intent name here', yourFunctionHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function yourFunctionHandler(agent) {
  //   agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
  //   agent.add(new Card({
  //       title: `Title: this is a card title`,
  //       imageUrl: 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png',
  //       text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
  //       buttonText: 'This is a button',
  //       buttonUrl: 'https://assistant.google.com/'
  //     })
  //   );
  //   agent.add(new Suggestion(`Quick Reply`));
  //   agent.add(new Suggestion(`Suggestion`));
  //   agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  // }

  // // Uncomment and edit to make your own Google Assistant intent handler
  // // uncomment `intentMap.set('your intent name here', googleAssistantHandler);`
  // // below to get this function to be run when a Dialogflow intent is matched
  // function googleAssistantHandler(agent) {
  //   let conv = agent.conv(); // Get Actions on Google library conv instance
  //   conv.ask('Hello from the Actions on Google client library!') // Use Actions on Google library
  //   agent.add(conv); // Add Actions on Google library responses to your agent's response
  // }
  // // See https://github.com/dialogflow/fulfillment-actions-library-nodejs
  // // for a complete Dialogflow fulfillment library Actions on Google client library v2 integration sample

  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Workout Plan' , plan);
  intentMap.set('Single Workout', single);
  intentMap.set('How To', howto);
  intentMap.set('Targeting Exercises', target);
  // intentMap.set('your intent name here', yourFunctionHandler);
  // intentMap.set('your intent name here', googleAssistantHandler);
  agent.handleRequest(intentMap);
});
