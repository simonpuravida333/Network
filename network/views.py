import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
from datetime import datetime, time, date, timedelta, timezone

from .models import User, Post, Follow, Like

def index(request):
	return render(request, "network/index.html")

def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def getPosts(peopleOfAttention, start, end):
	everything = []
	if len(peopleOfAttention) == 0:
		everything = Post.objects.all()
	else:
		for eachOne in peopleOfAttention:
			everything += Post.objects.filter(poster = eachOne)
	
	if end > len(everything):
		end = len(everything)
		
	chronList = []
	for eachOne in everything:
		chronList.append([eachOne, eachOne.timestamp.timestamp()])# creates a 2D list
	reverseChronList = sorted(chronList, key=lambda post: post[1], reverse = True)#... on which the list can get sorted (reverse) chronologically
	
	everything = []
	for x in range(start, end):
		everything.append(reverseChronList[x][0])#...then the post objects are being put back into their own list
	return everything
	
def allPosts(request):
	start = int(request.GET.get("start"))
	end = int(request.GET.get("end"))
	
	return JsonResponse([eachOne.toJSON() for eachOne in getPosts([],start,end)], status=200, safe=False)

@login_required	
def followedPeoplePosts(request):
	start = int(request.GET.get("start"))
	end = int(request.GET.get("end"))
	
	peopleOfAttention = []
	try:
		followObjects = Follow.objects.filter(follower = request.user)
		for people in followObjects:
			peopleOfAttention.append(people.personOfAttention)
	except(Follow.DoesNotExist, AttributeError):
		pass
	if len(peopleOfAttention) == 0:
		return JsonResponse({"message":"You're currently not following anyone."}, status=200)
	else:
		return JsonResponse([eachOne.toJSON() for eachOne in getPosts(peopleOfAttention, start, end)], status=200, safe=False)

def posterPosts(request, username):
	start = int(request.GET.get("start"))
	end = int(request.GET.get("end"))

	poster = User.objects.get(username = username)
	return JsonResponse([eachOne.toJSON() for eachOne in getPosts([poster],start,end)], safe=False)

@login_required	
def likeUnlike(request, post_id):
	post = Post.objects.get(id=post_id)
	liker = request.user
	action = str(request.GET.get("action"))
	
	if (action == "update"):
		try:
			likedPost = Like.objects.get(liker=liker, post=post)
			likedPost.delete()
			return JsonResponse({"message": "Like removed from DB"},status=200)
		except(Like.DoesNotExist, AttributeError):
			likedPost = Like(liker=liker, post=post)
			likedPost.save()
			return JsonResponse({"message": "Like saved to DB"},status=201)
	if (action == "read"):
		try:
			likedPost = Like.objects.get(liker=liker, post=post)
			return JsonResponse({"liked": True})
		except(Like.DoesNotExist, AttributeError):
			return JsonResponse({"liked": False})
	
@login_required	
def followUnfollow(request, username):
	followedOne = User.objects.get(username = username)
	follower = request.user
	
	message = None
	try:
		followObject = Follow.objects.get(follower = request.user, personOfAttention = followedOne)
		followObject.delete()
		message = "Not following anymore - removed from database."
	except (Follow.DoesNotExist, AttributeError):
		followObject = Follow(follower = request.user, personOfAttention = followedOne)
		followObject.save()
		message = "Now following - added to database."
	return JsonResponse({"message": message}, status=204)
		
@login_required	
@csrf_exempt		
def newPost(request):
	if request.method != "POST":
		return JsonResponse({"error": "POST request required."}, status=400)
        
	incoming = json.loads(request.body)
	content = incoming.get("content")
	if len(content) == 0:
		return JsonResponse({"error": "empty POST"}, status=400)
	
	p = Post(poster = request.user, post = content, timestamp = datetime.now(timezone.utc))
	p.save()
	return JsonResponse({"message": "Post placed successfully."}, status=201)

@login_required		
@csrf_exempt
def updatePost(request):
	id = int(request.GET.get("post_id"))
	post = Post.objects.get(id = id)
	if request.method == "PUT":
		incoming = json.loads(request.body)
		post.post = incoming['content']
		post.save()
		return JsonResponse({"message": "Post updated."},status=204)

@csrf_exempt
def userSpace(request, username):
	personOfAttention = None
	if request.user.username == username:
		print("you're home")
		personOfAttention = request.user
	else:
		print("visiting someone else")
		try:
			personOfAttention = User.objects.get(username = username)
		except (User.DoesNotExist, AttributeError):
			return JsonResponse({'username': 'Does not exist.'},status=200) #or is it an error? it's just a fact.
	
	followingThisOne = None
	if request.user.is_anonymous is False and request.user.username != username:
		followingThisOne = False
		try:
			follow = Follow.objects.get(personOfAttention = personOfAttention, follower = request.user)
			followingThisOne = True
		except (Follow.DoesNotExist, AttributeError):
			pass
	
	# how many follow you
	followers = 0
	try:
		thatMany = Follow.objects.filter(personOfAttention = personOfAttention)
		followers = len(thatMany)
	except (Follow.DoesNotExist, AttributeError):
		pass
	
	# how many you follow
	following = 0
	try:
		thatMany = Follow.objects.filter(follower = personOfAttention)
		following = len(thatMany)
	except (Follow.DoesNotExist, AttributeError):
		pass
	
	toJSON = {
	"username": username,
	"followingThisOne": followingThisOne,
	"followers": followers,
	"following": following,
	}
	return JsonResponse(toJSON, status=200)
	
def userInfo(request):
	return JsonResponse({"user": str(request.user), "isAnonymous": str(request.user.is_anonymous)}, status=200)