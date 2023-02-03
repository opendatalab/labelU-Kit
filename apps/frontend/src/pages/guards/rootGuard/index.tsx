import React, { useEffect } from 'react';
import { Outlet, redirect, useNavigate } from 'react-router-dom';

import constants from '../../../constants';
import Login from '../../login1';
// export async function action({request , params } : any){
//     console.log({request,params})
//     return redirect(constants.urlTurnToSignUp);
// }
const RootGuard = () => {
  const token = window.localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      navigate('/tasks');
    } else {
      navigate('/login');
    }
  }, []);

  return <Outlet />;
};
export default RootGuard;
