// TODO

// USER LINK NOT WORKING ON ALL MESSAGES
// NO NAV TRIGGER HIGHLIGHTING FOR OTHER USER


function displayPosts(querySet)
{
	document.querySelector('#posts').innerHTML = "";
	
	let setLength = querySet.length;
	if (querySet.length > postsPerPage) setLength = postsPerPage; // if postPerPage +1 === querySet.length
	
	for (let x = 0; x < setLength; x++)
	{		
		const postFrame = document.createElement('div');
		const userAndDate = document.createElement('div');
		const username = document.createElement('div');
		const date = document.createElement('div');
		const content = document.createElement('div');
		const likeAndEdit = document.createElement('div');
		postFrame.classList.add("postFrame");
		userAndDate.classList.add("userAndDate");
		username.classList.add("username");
		date.classList.add("date");
		content.classList.add("content");
		likeAndEdit.classList.add("likeAndEdit");
		username.innerHTML = querySet[x].user;
		date.innerHTML = querySet[x].when;
		const contentString = querySet[x].content.replaceAll("\n", "<br>"); // takes over paragraphs / new lines
		content.innerHTML = contentString;
		let liked = false;
				
		if(isLoggedIn)
		{
			const like = document.createElement('div');
			like.classList.add("like");
			fetch(`/like/${querySet[x].id}?action=read`)
			.then(response => response.json())
			.then(likeStatus =>
			{
				liked = likeStatus.liked;
				if (liked) like.innerHTML = "💜";
				else like.innerHTML = "🤍";
			})
				
			like.addEventListener('click', ()=>
			{
				fetch(`like/${querySet[x].id}?action=update`)
				.then(response => response.json())
				.then(update =>
				{
					console.log(update.message);
					if (!(update.message === "Like removed from DB" || update.message === "Like saved to DB"))
					{
						alert('Sorry. Server could not update the like.');
						return;
					}
					
					// update everything by keeping track of client-side variables. But waiting for server to have fulfilled the job, so that nothing gets out of sync.
					if (liked)
					{
						like.innerHTML = "🤍"; 
						liked = false;
					}
					else
					{
						like.innerHTML = "💜";
						liked = true;
					}
				})
			})
			likeAndEdit.append(like);
		}
		
		username.addEventListener('click', ()=> reset('user', querySet[x].user));
		
		userAndDate.append(username, date);
		postFrame.append(userAndDate, content, likeAndEdit);
		document.querySelector('#posts').append(postFrame);
		postFrame.style.display = 'none';
		setTimeout(()=>
		{
			postFrame.style.display = 'block';
			postFrame.style.opacity = 0;
			postFrame.animate([{opacity:0},{opacity:1}],333).onfinish = ()=> postFrame.style.opacity = 1;
		},150*x)
		
		
		if (loggedInUser === querySet[x].user)
		{
			const edit = document.createElement('div');
			const saveChanges = document.createElement('div');
			const textarea= document.createElement('textarea');
			edit.innerHTML = "Edit this Post";
			edit.classList.add("edit");
			saveChanges.innerHTML = "Save Changes";
			saveChanges.classList.add("edit");
			saveChanges.style.display = "none";
			likeAndEdit.append(edit, saveChanges);
			
			edit.addEventListener('click', ()=>
			{
				edit.style.display = 'none';
				textarea.style.display = 'block';
				content.innerHTML = "";
				content.append(textarea);
				textarea.value = querySet[x].content.replaceAll("<br>", "\n"); // switches the two paragraph-signs. textarea uses innerText, where paragraphs are signified with \n, other than innerHTML: <br>.
				saveChanges.style.display = 'block';
			})
			saveChanges.addEventListener('click', ()=>
			{
				if (textarea.value !== "")
				{
					fetch(`/updatePost?post_id=${querySet[x].id}`,
					{
						method: 'PUT',
						body: JSON.stringify
						({ content: textarea.value.replaceAll("\n", "<br>") })
					})
					.then(response =>
					{
						saveChanges.style.display = 'none';
						textarea.style.display = 'none';
						edit.style.display = 'block';
						console.log(response);
						if (!(200 <= response.status < 300))
						{
							alert("Sorry. Server could not update the post.");
							return;
						}
						querySet[x].content = textarea.value.replaceAll("\n", "<br>");
						content.innerHTML = querySet[x].content;
					})
				}
			})
		}
	}
}

function userSpace(username)
{
	document.querySelector('#postsHeadline').innerHTML = `● ${username}'s Messages ●`;
	if (loggedInUser === username)
	{	
		document.querySelector	('#postsHeadline').innerHTML = '● Your Messages ●';
		newPost();
	}
	
	fetch('/userSpace/'+username)
	.then(response => response.json())
	.then(userSpace =>
	{
		if (userSpace.username === "Does not exist.")
		{
			document.querySelector('#postsHeadline').innerHTML = "The user "+username+" does not exist.";
			return;
		}
		
		const theName = document.createElement('div');
		const userInfo = document.createElement('div');
 		const followers = document.createElement('div');
 		const following = document.createElement('div');
 		if (username === loggedInUser) theName.innerHTML = username+" (You)";
 		else theName.innerHTML = username;
 		let followersAmount = userSpace.followers;
		followers.innerHTML = "Followers: "+ followersAmount;
		following.innerHTML = "Follows: "+ userSpace.following;
		theName.id = "theName";
		userInfo.classList.add("userSpaceBox");
		userInfo.append(followers, following);
		document.querySelector('#userSpace').append(theName, userInfo);
	
		if(isLoggedIn && loggedInUser	!== username)
		{
			const follow = document.createElement('div');
			const followState = document.createElement('div');
			const followTrigger = document.createElement('div');
			follow.classList.add("userSpaceBox");
			followState.id = "followState";
			followTrigger.id = "followTrigger";
			
			let followBool = userSpace.followingThisOne	;
			if (followBool)
			{
				followState.innerHTML = "You are a follower.";
				followTrigger.innerHTML = "Stop following "+username;
			}
			else
			{
				followState.innerHTML = "Currently not following.";
				followTrigger.innerHTML = "Become a follower of "+username;
				followTrigger.style.color = '#886CE4';
			}
			followTrigger.addEventListener('click', ()=>
			{
				if (followBool)
				{
					followState.innerHTML = "Currently not following.";
					followTrigger.innerHTML = "Become a follower of "+username;
					followTrigger.style.color = '#886CE4';
					followBool = false;
					fetch('/follow/'+username)
					.then(response =>
					{
						console.log(response);
						if (!(200 <= response.status < 300))
						{
							alert('Sorry. The server was not able to process your follow/unfollow request.')
							reset('user', username);
							return;
						}
						followersAmount--;
						followers.innerHTML = "Followers: "+ followersAmount;
					})
				}
				else
				{
					followState.innerHTML = "You are a follower.";
					followTrigger.innerHTML = "Stop following "+username;
					followTrigger.style = null;
					followBool = true;
					fetch('/follow/'+username)
					.then(response =>
					{
						console.log(response);
						if (!(200 <= response.status < 300))
						{
							alert('Sorry. The server was not able to process your follow/unfollow request.')
							reset('user', username);
							return;
						}
						followersAmount++;
						followers.innerHTML = "Followers: "+ followersAmount;
					})
				}
			})
			follow.append(followState, followTrigger);
			follow.style['background-color'] = 'white';
			follow.style.color = '#002e3f';
			document.querySelector('#userSpace').append(follow);
		}
	})
	posterPosts(username);
}

function newPost()
{
	document.querySelector('#newPost').style = null;
	document.querySelector("#userSpace").style = null;
	document.querySelector('form').onsubmit = () =>
	{
    	let content = document.querySelector('#postTextarea').value;
    	document.querySelector('#postTextarea').value = "";
    	if (content === "")
    	{
    		console.log('empty post. Returning.');
    		return false;
    	}
    	
		fetch('/newPost',
    	{
			method: 'POST',
			body: JSON.stringify
			({
				content: content,
			})
		})
		.then(response =>
		{
			console.log(response);
			startPage = 0;
			endPage = postsPerPage+1;
			posterPosts(loggedInUser);
		})
		return false;
	}
}

// PAGE GENERATION
function allPosts()
{
	document.querySelector	('#postsHeadline').innerHTML = '● All Messages ●'

	fetch(`/allPosts?start=${startPage}&end=${endPage}`)
	.then(response => response.json())
	.then(incomingPosts =>
	{
		document.querySelector("#pagination").innerHTML = "";
		if (startPage >= postsPerPage)	generatePreviousPage(allPosts);
		if (incomingPosts.length == postsPerPage+1) generateNextPage(allPosts);
		displayPosts(incomingPosts);
	})
}
function posterPosts(username)
{
	fetch(`/posterPosts/${username}?start=${startPage}&end=${endPage}`)
	.then(response => response.json())
	.then(incomingPosts =>
	{
		document.querySelector("#pagination").innerHTML = "";
		if (startPage >= postsPerPage)	generatePreviousPage(posterPosts, username);
		if (incomingPosts.length === postsPerPage+1) generateNextPage(posterPosts, username);
		displayPosts(incomingPosts);
	})
}
function followedPeoplePosts()
{
	fetch(`/followedPeoplePosts?start=${startPage}&end=${endPage}`)
	.then(response => response.json())
	.then(incomingPosts =>
	{
		if (incomingPosts.message === undefined)
		{
			document.querySelector('#postsHeadline').innerHTML = "● Messages from the people you follow ●";
			document.querySelector("#pagination").innerHTML = "";
			if (startPage >= postsPerPage) generatePreviousPage(followedPeoplePosts);
			if (incomingPosts.length === postsPerPage+1) generateNextPage(followedPeoplePosts);
			displayPosts(incomingPosts);
		}
		else
		{
			document.querySelector("#pagination").innerHTML = "";
			document.querySelector	('#postsHeadline').innerHTML = "You're currently not following anyone.";
			console.log(incomingPosts.message);
		}
	})
}
function generateNextPage(theFunction, username)
{
	let nextPage = document.createElement('div');
	nextPage.id = "nextPage";
	nextPage.innerHTML = "Next Page";
	document.querySelector("#pagination").append(nextPage);
	nextPage.addEventListener('click', ()=>
	{
		startPage += postsPerPage;
		endPage = startPage + postsPerPage+1;
		theFunction(username);
	})
}
function generatePreviousPage(theFunction, username)
{
	let previousPage = document.createElement('div');
	previousPage.id = "previousPage";
	previousPage.innerHTML = "Previous Page";
	document.querySelector("#pagination").append(previousPage);
	previousPage.addEventListener('click', () =>
	{
		startPage -= postsPerPage;
		endPage = startPage+postsPerPage+1;
		theFunction(username);
	})
}
// END PAGE GENERATION

// NAVIGATION, CONTENT RESET AND SCRIPT EXECUTION START
document.querySelector('#allPosts').addEventListener('click', ()=>{reset('allPosts')});
if (document.querySelector('#user') !== null) document.querySelector('#user').addEventListener('click', ()=>{reset('user', loggedInUser)}); // if not logged out
if (document.querySelector('#following') !== null) document.querySelector('#following').addEventListener('click', ()=>{reset('following')});

function reset(navTrigger, username)
{
	if (navTrigger !== 'following' && document.querySelector('#following') !== null) document.getElementById('following').style = null;
	if (navTrigger !== 'user' && document.querySelector('#user') !== null) document.getElementById('user').style = null;
	if (navTrigger !== 'allPosts') document.getElementById('allPosts').style = null;
	document.getElementById(navTrigger).style['font-weight'] = 600;
	document.getElementById(navTrigger).style.color = 'deepskyblue';
	if (username !== undefined) // navTrigger = 'user'
	{
		if (username !== loggedInUser) document.getElementById('user').style = null;
	}
	
	document.querySelector('#posts').innerHTML = "";
	document.querySelector('#newPost').style.display = 'none';
	startPage = 0;
	endPage = postsPerPage+1;
	
	if (navTrigger === 'user')
	{
		// remember, setting JS-set styling to null puts the CSS BACK IN PLACE, making it visible (as in this script JS-set styling is used to make display = none).
		const theSpace = document.querySelector('#userSpace');
		theSpace.style = null;
		theSpace.innerHTML	 = "";
		userSpace(username);
	}
	else document.querySelector('#userSpace').style.display = 'none';
	if (navTrigger === 'following' && isLoggedIn) followedPeoplePosts();
	if (navTrigger === 'allPosts') allPosts();
	
	startPage = 0;
	endPage = postsPerPage+1;
}

var postsPerPage = 10;
var startPage = 0;
var endPage = postsPerPage+1; // caution: python range ends BEFORE end, meaning range from 0 to 10 are actually 10.
// Makes fetches call for 11 posts, with the eleventh one (if coming back / existing) triggering a next-page link-generation.
var isLoggedIn = false;
var loggedInUser = ""; // the name
document.querySelector('#posts').innerHTML = "";
document.querySelector('#newPost').style.display = 'none';

window.onload= ()=>
{
	fetch('/userInfo')
	.then(response => response.json())
	.then(userInfo =>
	{
		isLoggedIn = !userInfo.isAnonymous;
		if (isLoggedIn) loggedInUser = userInfo.user;
				
		console.log("username: "+loggedInUser);
		console.log("is logged in?: "+isLoggedIn);
		reset('allPosts');
	});
}