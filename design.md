Entries:

GET http://www.example.com/some -> redirect http://www.example.com/some/
POST http://www.example.com/some -> redirect http://www.example.com/some/

GET http://www.example.com/some/ -> run loader -> render page -> return
POST http://www.example.com/some/?saction=xxxx -> run action -> run loader -> render page -> return

GET http://www.example.com/some/s-data.json -> run loader -> return
POST http://www.example.com/some/s-data.json?saction=xxxx -> run action -> run loader -> return

Endpoints:

http://www.example.com/index -> redirect http://www.example.com/index/
http://www.example.com/index/ -> run endpoint -> return
http://www.example.com/index/s-data.json -> we don't care

http://www.example.com/param -> redirect http://www.example.com/param/
http://www.example.com/param/ -> run endpoint -> return
http://www.example.com/param/s-data.json -> we don't care

404:

http://www.example.com/non-exist -> renders 404 page
http://www.example.com/non-exist/ -> renders 404 page
http://www.example.com/non-exist/s-data.json -> renders 404 page

|                | Middleware      | Loader | Action          |
| -------------- | --------------- | ------ | --------------- |
| return T       | as-is           | as-is  | as-is           |
| throw Response | return Response | 500    | return Response |
| throw URL      | redirect        | 500    | redirect        |
| throw Error    | 500             | 500    | 500             |
