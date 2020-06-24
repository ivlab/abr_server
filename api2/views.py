from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.
def index(request):
    return render(request, 'abr_server.html')

def test(request):
    return HttpResponse('Hello world')