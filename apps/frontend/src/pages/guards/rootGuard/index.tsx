import React, { useEffect } from 'react';
import { Outlet, redirect } from 'react-router-dom';
import constants from '../../../constants';
import Login from '../../login1';
import { useNavigate } from 'react-router-dom';
// export async function action({request , params } : any){
//     console.log({request,params})
//     return redirect(constants.urlTurnToSignUp);
// }
const RootGuard = () => {
  let token = window.localStorage.getItem('token');
  // if (token) {
  //     return (<Outlet />)
  // }else{
  //     return redirect(constants.urlToLogin)
  // }
  const navigate = useNavigate();

  // return (<React.Fragment>
  //         { token ?
  //             <Outlet/> : <Login />}
  //         {/*<Outlet/>*/}
  //     </React.Fragment>
  //     )
  useEffect(() => {
    if (window.location.pathname === '/') {
      navigate(constants.urlToTasks);
    }
    let token = localStorage.getItem('token');
    let username = localStorage.getItem('username');
    if (token && username) {
      navigate('/tasks');
    } else {
      navigate('/login');
    }
  }, []);

  return <Outlet />;
};
export default RootGuard;
